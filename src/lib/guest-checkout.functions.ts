import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';

// Guest checkout: a signed-out visitor can subscribe with just an email.
// We mint a claim code up front, stamp it on the Stripe session + subscription
// metadata, and store a pending row. After they create an account they redeem
// the code and the subscription is attached to their user id.

const GUEST_PLANS = new Set(['rizz_gold_weekly', 'rizz_diamond_weekly']);

export type GuestCheckoutResult = { clientSecret: string; code: string } | { error: string };
export type GuestClaimLookup =
  | { state: 'ready'; code: string; email: string | null; claimed: boolean }
  | { state: 'pending' }
  | { state: 'error'; reason: string };
export type ClaimResult = { ok: true; tier: 'plus' | 'vip' } | { error: string };

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars

function mintCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `CRUSH-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

function tierFor(priceId: string): 'plus' | 'vip' {
  return priceId === 'rizz_diamond_weekly' || priceId === 'rizz_vip_monthly' ? 'vip' : 'plus';
}

// ---- 1. Guest starts checkout (no account required) ----
export const createGuestCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { priceId: string; email: string; returnUrl: string; environment: StripeEnv }) => {
    if (!GUEST_PLANS.has(data.priceId)) throw new Error('This plan is not available for guest checkout.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) throw new Error('Enter a valid email address.');
    if (data.email.length > 200) throw new Error('Email is too long.');
    return data;
  })
  .handler(async ({ data }): Promise<GuestCheckoutResult> => {
    try {
      const email = data.email.trim().toLowerCase();
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error('Price not found');
      const price = prices.data[0];

      const code = mintCode();
      const customer = await stripe.customers.create({
        email,
        metadata: { guestCode: code },
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'subscription',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        currency: price.currency,
        adaptive_pricing: { enabled: false },
        customer: customer.id,
        metadata: { kind: 'guest_platform', guestCode: code, priceLookupKey: data.priceId },
        subscription_data: {
          metadata: { kind: 'guest_platform', guestCode: code, priceLookupKey: data.priceId },
        },
      });

      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { error } = await supabaseAdmin.from('guest_subscriptions').insert({
        code,
        email,
        price_id: data.priceId,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: customer.id,
        status: 'pending',
        environment: data.environment,
      });
      if (error) throw new Error(error.message);

      return { clientSecret: session.client_secret ?? '', code };
    } catch (error) {
      console.error('[payments] createGuestCheckoutSession failed:', error);
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---- 2. After payment, reveal the claim code for that session ----
export const getGuestClaimCode = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_[A-Za-z0-9_]+$/.test(data.sessionId)) throw new Error('Invalid session id');
    return data;
  })
  .handler(async ({ data }): Promise<GuestClaimLookup> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.metadata?.kind !== 'guest_platform') return { state: 'error', reason: 'Not a guest checkout.' };
      if (session.payment_status === 'unpaid' && session.status !== 'complete') return { state: 'pending' };

      const code = session.metadata?.guestCode;
      if (!code) return { state: 'error', reason: 'No claim code on this checkout.' };

      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { data: row } = await supabaseAdmin
        .from('guest_subscriptions')
        .select('email, claimed_by')
        .eq('code', code)
        .maybeSingle();

      return { state: 'ready', code, email: row?.email ?? null, claimed: !!row?.claimed_by };
    } catch (error) {
      console.error('[payments] getGuestClaimCode failed:', error);
      return { state: 'error', reason: getStripeErrorMessage(error) };
    }
  });

// ---- 3. Signed-in user redeems the code ----
export const claimGuestSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string; environment: StripeEnv }) => {
    const code = data.code.trim().toUpperCase();
    if (!/^CRUSH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) throw new Error('That code doesn’t look right.');
    return { ...data, code };
  })
  .handler(async ({ data, context }): Promise<ClaimResult> => {
    const { userId } = context;
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { data: row, error } = await supabaseAdmin
        .from('guest_subscriptions')
        .select('*')
        .eq('code', data.code)
        .eq('environment', data.environment)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return { error: 'We couldn’t find that subscription code.' };
      if (row.claimed_by && row.claimed_by !== userId) {
        return { error: 'This code has already been claimed by another account.' };
      }
      if (!row.stripe_subscription_id) {
        return { error: 'This payment is still processing — try again in a minute.' };
      }

      const stripe = createStripeClient(data.environment);
      const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      const active = subscription.status === 'active' || subscription.status === 'trialing';
      if (!active) return { error: 'That subscription is no longer active.' };

      // Point Stripe at the real user so renewals + the portal work normally.
      await stripe.subscriptions.update(row.stripe_subscription_id, {
        metadata: { ...(subscription.metadata ?? {}), userId, kind: 'platform' },
      });
      if (row.stripe_customer_id) {
        await stripe.customers.update(row.stripe_customer_id, { metadata: { userId, guestCode: row.code } });
      }

      const item = subscription.items?.data?.[0];
      const periodStart = (item as any)?.current_period_start ?? (subscription as any).current_period_start;
      const periodEnd = (item as any)?.current_period_end ?? (subscription as any).current_period_end;
      const tier = tierFor(row.price_id);

      const { error: upErr } = await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: row.stripe_customer_id ?? (subscription.customer as string),
          product_id: typeof item?.price?.product === 'string' ? item.price.product : '',
          price_id: row.price_id,
          status: subscription.status,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          environment: data.environment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_subscription_id' },
      );
      if (upErr) throw new Error(upErr.message);

      await supabaseAdmin.from('profiles').update({ platform_tier: tier }).eq('id', userId);
      await supabaseAdmin
        .from('guest_subscriptions')
        .update({ claimed_by: userId, claimed_at: new Date().toISOString(), status: subscription.status })
        .eq('id', row.id);

      return { ok: true, tier };
    } catch (err) {
      console.error('[payments] claimGuestSubscription failed:', err);
      return { error: getStripeErrorMessage(err) };
    }
  });
