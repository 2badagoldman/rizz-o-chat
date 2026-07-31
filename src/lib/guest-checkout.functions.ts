import type Stripe from 'stripe';
import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';
import { findGuestRowForUser, normalizePhone, redeemGuestRow, tierFor } from '@/lib/guest-checkout.server';

// Guest checkout: a signed-out visitor can subscribe with just an email (and
// optionally a phone number). We mint a claim code up front, stamp it on the
// Stripe session + subscription metadata, and store a pending row. When they
// later create an account with the same email or phone the subscription is
// attached automatically — the code is the manual fallback.

const GUEST_PLANS = new Set(['rizz_gold_weekly', 'rizz_diamond_weekly']);

export type GuestCheckoutResult = { clientSecret: string; code: string } | { error: string };
export type GuestClaimLookup =
  | { state: 'ready'; code: string; email: string | null; claimed: boolean }
  | { state: 'pending' }
  | { state: 'error'; reason: string };
export type ClaimResult = { ok: true; tier: 'plus' | 'vip' } | { error: string };
export type AutoClaimResult = { ok: true; tier: 'plus' | 'vip'; code: string } | { ok: false };

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars

function mintCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `CRUSH-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

// ---- 1. Guest starts checkout (no account required) ----
export const createGuestCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { priceId: string; email: string; phone?: string; returnUrl: string; environment: StripeEnv }) => {
      if (!GUEST_PLANS.has(data.priceId)) throw new Error('This plan is not available for guest checkout.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) throw new Error('Enter a valid email address.');
      if (data.email.length > 200) throw new Error('Email is too long.');
      if (data.phone && !normalizePhone(data.phone)) throw new Error('Enter a valid phone number.');
      return data;
    },
  )
  .handler(async ({ data }): Promise<GuestCheckoutResult> => {
    try {
      const email = data.email.trim().toLowerCase();
      const phone = data.phone ? normalizePhone(data.phone) : null;
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error('Price not found');
      const price = prices.data[0];

      const code = mintCode();
      const customer = await stripe.customers.create({
        email,
        ...(phone ? { phone } : {}),
        metadata: { guestCode: code },
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'subscription',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        currency: price.currency,
        managed_payments: { enabled: true },
        customer: customer.id,
        metadata: {
          kind: 'guest_platform',
          guestCode: code,
          priceLookupKey: data.priceId,
          managed_payments: 'true',
        },
        subscription_data: {
          metadata: { kind: 'guest_platform', guestCode: code, priceLookupKey: data.priceId },
        },
      } as Stripe.Checkout.SessionCreateParams);

      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { error } = await supabaseAdmin.from('guest_subscriptions').insert({
        code,
        email,
        phone,
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
      // Match on the code alone — a live code must still redeem from a test-mode
      // preview build. The row's own environment drives the Stripe calls.
      const { data: row, error } = await supabaseAdmin
        .from('guest_subscriptions')
        .select('*')
        .eq('code', data.code)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return { error: 'We couldn’t find that subscription code.' };

      return await redeemGuestRow(row as any, userId);
    } catch (err) {
      console.error('[payments] claimGuestSubscription failed:', err);
      return { error: getStripeErrorMessage(err) };
    }
  });

// ---- 4. Silent attach on sign-in: match the account's email or phone ----
export const autoClaimGuestSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AutoClaimResult> => {
    try {
      const row = await findGuestRowForUser(context.userId);
      if (!row) return { ok: false };
      const result = await redeemGuestRow(row, context.userId);
      if ('error' in result) return { ok: false };
      return { ok: true, tier: result.tier, code: row.code };
    } catch (err) {
      console.error('[payments] autoClaimGuestSubscription failed:', err);
      return { ok: false };
    }
  });

export { tierFor };
