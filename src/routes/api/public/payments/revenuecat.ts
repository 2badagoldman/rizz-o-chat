/**
 * RevenueCat webhook — alternative payment rail to Stripe.
 *
 * RevenueCat POSTs every store purchase / renewal / cancellation here. The
 * handler grants exactly the same entitlements the Stripe webhook grants, so
 * a member who pays through the App Store or Google Play ends up in the same
 * state as one who paid by card.
 *
 * Security: RevenueCat sends a fixed `Authorization` header configured in the
 * RevenueCat dashboard. We compare it against REVENUECAT_WEBHOOK_SECRET in
 * constant time and reject everything else.
 */
import { createFileRoute } from '@tanstack/react-router';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let _sb: SupabaseClient<Database> | null = null;
function sb(): SupabaseClient<Database> {
  if (!_sb) {
    _sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

/** Store product identifier -> internal Crush price id.
 *  Both the legacy `_weekly` identifiers and the monthly-named variants are
 *  accepted, because the App Store / Play catalogs use 1-month durations. */
const PRODUCT_TO_PRICE: Record<string, string> = {
  crush_gold_weekly: 'rizz_gold_weekly',
  crush_gold_monthly: 'rizz_gold_weekly',
  crush_gold: 'rizz_gold_weekly',
  crush_diamond_weekly: 'rizz_diamond_weekly',
  crush_diamond_monthly: 'rizz_diamond_weekly',
  crush_diamond: 'rizz_diamond_weekly',
  crush_coins_500: 'coins_500_onetime',
  crush_coins_1500: 'coins_1500_onetime',
  crush_coins_5000: 'coins_5000_onetime',
  crush_coins_15000: 'coins_15000_onetime',
};

/** Fallback when the product id is unrecognised: RevenueCat always sends the
 *  entitlement(s) the purchase unlocked, so tiers still grant correctly. */
function priceFromEntitlements(event: any): string | null {
  const ids: string[] = Array.isArray(event?.entitlement_ids)
    ? event.entitlement_ids
    : event?.entitlement_id
      ? [event.entitlement_id]
      : [];
  const lower = ids.map((i) => String(i).toLowerCase());
  if (lower.includes('diamond')) return 'rizz_diamond_weekly';
  if (lower.includes('gold') || lower.includes('plus')) return 'rizz_gold_weekly';
  return null;
}

const COIN_PACKS: Record<string, number> = {
  coins_500_onetime: 500,
  coins_1500_onetime: 1500,
  coins_5000_onetime: 5000,
  coins_15000_onetime: 15000,
};

const VIP_COINS = 2000;

const GRANT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'NON_RENEWING_PURCHASE',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
]);

const REVOKE_TYPES = new Set(['EXPIRATION', 'BILLING_ISSUE', 'SUBSCRIPTION_PAUSED']);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function tierFor(priceId: string): 'plus' | 'vip' | null {
  if (priceId === 'rizz_diamond_weekly') return 'vip';
  if (priceId === 'rizz_gold_weekly') return 'plus';
  return null;
}

/** RevenueCat sandbox purchases land in the sandbox environment bucket, so
 *  they never mix with live subscription rows. */
function envFor(event: any): 'sandbox' | 'live' {
  return event?.environment === 'PRODUCTION' ? 'live' : 'sandbox';
}

// Reuses the shared dedupe table so a retried delivery can't double-credit.
async function alreadyProcessed(eventId: string, type: string): Promise<boolean> {
  const { error } = await sb()
    .from('webhook_events')
    .insert({ event_id: `rc_${eventId}`, type: `revenuecat.${type}` });
  if (error && (error.code === '23505' || /duplicate/i.test(error.message))) return true;
  if (error) throw error;
  return false;
}

async function audit(
  userId: string | null,
  status: string,
  env: 'sandbox' | 'live',
  details: Record<string, unknown>,
  errorMessage?: string,
) {
  await sb().from('payment_audit_log').insert({
    user_id: userId,
    kind: 'revenuecat',
    status,
    environment: env,
    details: details as never,
    error_message: errorMessage ?? null,
  });
}

async function handleEvent(event: any) {
  const type: string = event?.type ?? 'UNKNOWN';
  const env = envFor(event);
  // app_user_id is the Crush user id (set via Purchases.configure/logIn).
  const userId: string | null = event?.app_user_id ?? null;
  const productId: string = event?.product_id ?? '';
  // Google Play appends the base plan id, e.g. "crush_gold_weekly:weekly".
  const priceId =
    PRODUCT_TO_PRICE[productId] ??
    PRODUCT_TO_PRICE[productId.split(':')[0]] ??
    priceFromEntitlements(event) ??
    null;

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    await audit(null, 'unattributed', env, { type, productId, app_user_id: userId });
    return;
  }
  if (!priceId) {
    await audit(userId, 'unknown_product', env, { type, productId });
    return;
  }

  const isCoins = priceId in COIN_PACKS;

  if (GRANT_TYPES.has(type)) {
    if (isCoins) {
      let coins = COIN_PACKS[priceId];
      if (priceId === 'coins_15000_onetime') coins = Math.floor(coins * 1.1); // matches Stripe bonus
      await sb().rpc('credit_coins', { _user_id: userId, _coins: coins });
      await audit(userId, 'coins_credited', env, { type, productId, coins });
      return;
    }

    const expires = event?.expiration_at_ms ? new Date(Number(event.expiration_at_ms)).toISOString() : null;
    const started = event?.purchased_at_ms ? new Date(Number(event.purchased_at_ms)).toISOString() : null;

    await sb().from('subscriptions').upsert(
      {
        user_id: userId,
        // Store-side identifiers reuse the existing columns, prefixed so they
        // can never collide with a real Stripe id.
        stripe_subscription_id: `rc_${event?.original_transaction_id ?? event?.transaction_id ?? event?.id}`,
        stripe_customer_id: `rc_${userId}`,
        product_id: productId,
        price_id: priceId,
        status: 'active',
        current_period_start: started,
        current_period_end: expires,
        cancel_at_period_end: false,
        environment: env,
        provider: 'revenuecat',
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'stripe_subscription_id' },
    );

    const tier = tierFor(priceId);
    if (tier) await sb().from('profiles').update({ platform_tier: tier }).eq('id', userId);
    // Diamond includes the monthly coin drop on every renewal, same as Stripe.
    if (priceId === 'rizz_diamond_weekly') {
      await sb().rpc('credit_coins', { _user_id: userId, _coins: VIP_COINS });
    }
    await audit(userId, 'subscription_active', env, { type, productId, priceId, expires });
    return;
  }

  if (type === 'CANCELLATION') {
    // Store cancellation keeps access until the period ends.
    await sb()
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', `rc_${event?.original_transaction_id ?? event?.transaction_id}`)
      .eq('environment', env);
    await audit(userId, 'cancel_scheduled', env, { type, productId });
    return;
  }

  if (REVOKE_TYPES.has(type) || type === 'REFUND') {
    if (isCoins) {
      await audit(userId, 'coin_refund', env, { type, productId });
      return;
    }
    await sb()
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', `rc_${event?.original_transaction_id ?? event?.transaction_id}`)
      .eq('environment', env);
    await sb().from('profiles').update({ platform_tier: 'free' }).eq('id', userId);
    await audit(userId, 'subscription_revoked', env, { type, productId });
    return;
  }

  await audit(userId, 'ignored', env, { type, productId });
}

export const Route = createFileRoute('/api/public/payments/revenuecat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
        if (!secret) return new Response('Not configured', { status: 503 });

        const header = request.headers.get('authorization') ?? '';
        const provided = header.startsWith('Bearer ') ? header.slice(7) : header;
        if (!timingSafeEqual(provided, secret)) {
          return new Response('Unauthorized', { status: 401 });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response('Invalid JSON', { status: 400 });
        }

        const event = body?.event ?? body;
        const eventId = String(event?.id ?? '');
        if (!eventId) return new Response('Missing event id', { status: 400 });

        try {
          if (await alreadyProcessed(eventId, String(event?.type ?? 'UNKNOWN'))) {
            return new Response('Already processed', { status: 200 });
          }
          await handleEvent(event);
        } catch (err) {
          console.error('RevenueCat webhook error', err);
          await audit(null, 'webhook_error', envFor(event), { eventId }, (err as Error)?.message).catch(() => {});
          return new Response('Webhook handler failed', { status: 500 });
        }

        return new Response('ok', { status: 200 });
      },
    },
  },
});
