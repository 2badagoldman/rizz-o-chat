/**
 * Shared fulfilment for the alternative payment rails (CCBill, SegPay, Epoch).
 *
 * Every rail funnels into grantPurchase()/revokeSubscription() so a member who
 * pays through a partner ends up in exactly the same state as a Stripe payer:
 * a row in `subscriptions`, the right `platform_tier`, credited coins, and an
 * entry in `payment_audit_log`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import type { Database } from '@/integrations/supabase/types';
import { CATALOG } from '@/lib/payment-partners';

let _sb: SupabaseClient<Database> | null = null;
export function sbAdmin(): SupabaseClient<Database> {
  if (!_sb) {
    _sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

export type PartnerEnv = 'sandbox' | 'live';

export function md5(input: string): string {
  return createHash('md5').update(input, 'utf8').digest('hex');
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}

/** Reuses the shared dedupe table so retried postbacks can never double-credit. */
export async function alreadyProcessed(provider: string, eventId: string, type: string): Promise<boolean> {
  const { error } = await sbAdmin()
    .from('webhook_events')
    .insert({ event_id: `${provider}_${eventId}`, type: `${provider}.${type}` });
  if (error && (error.code === '23505' || /duplicate/i.test(error.message))) return true;
  if (error) throw error;
  return false;
}

export async function auditPartner(
  provider: string,
  userId: string | null,
  status: string,
  env: PartnerEnv,
  details: Record<string, unknown>,
  errorMessage?: string,
) {
  await sbAdmin().from('payment_audit_log').insert({
    user_id: userId,
    kind: provider,
    status,
    environment: env,
    details: details as never,
    error_message: errorMessage ?? null,
  });
}

/** Grant everything a successful partner payment buys. */
export async function grantPurchase(args: {
  provider: string;
  userId: string;
  priceId: string;
  providerRef: string;
  env: PartnerEnv;
  periodEnd?: string | null;
  details?: Record<string, unknown>;
}): Promise<'coins' | 'subscription' | 'unknown_product'> {
  const item = CATALOG[args.priceId];
  if (!item) {
    await auditPartner(args.provider, args.userId, 'unknown_product', args.env, { priceId: args.priceId });
    return 'unknown_product';
  }

  if (item.kind === 'onetime') {
    await sbAdmin().rpc('credit_coins', { _user_id: args.userId, _coins: item.coins ?? 0 });
    await auditPartner(args.provider, args.userId, 'coins_credited', args.env, {
      priceId: args.priceId,
      coins: item.coins,
      ref: args.providerRef,
      ...args.details,
    });
    return 'coins';
  }

  const now = new Date();
  const end =
    args.periodEnd ??
    new Date(now.getTime() + (item.intervalDays ?? 7) * 86_400_000).toISOString();

  await sbAdmin().from('subscriptions').upsert(
    {
      user_id: args.userId,
      // Partner identifiers reuse the existing columns, prefixed so they can
      // never collide with a real Stripe id.
      stripe_subscription_id: `${args.provider}_${args.providerRef}`,
      stripe_customer_id: `${args.provider}_${args.userId}`,
      product_id: args.priceId,
      price_id: args.priceId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: end,
      cancel_at_period_end: false,
      environment: args.env,
      provider: args.provider,
      updated_at: now.toISOString(),
    } as never,
    { onConflict: 'stripe_subscription_id' },
  );

  if (item.tier) {
    await sbAdmin().from('profiles').update({ platform_tier: item.tier }).eq('id', args.userId);
  }
  // Diamond includes the weekly coin drop on every rebill, same as Stripe.
  if (item.tier === 'vip' && item.coins) {
    await sbAdmin().rpc('credit_coins', { _user_id: args.userId, _coins: item.coins });
  }

  await auditPartner(args.provider, args.userId, 'subscription_active', args.env, {
    priceId: args.priceId,
    ref: args.providerRef,
    periodEnd: end,
    ...args.details,
  });
  return 'subscription';
}

export async function revokeSubscription(args: {
  provider: string;
  providerRef: string;
  env: PartnerEnv;
  immediate?: boolean;
}) {
  const key = `${args.provider}_${args.providerRef}`;
  const { data } = await sbAdmin()
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', key)
    .maybeSingle();

  if (args.immediate) {
    await sbAdmin()
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', key);
    if (data?.user_id) {
      await sbAdmin().from('profiles').update({ platform_tier: 'free' }).eq('id', data.user_id);
    }
  } else {
    // Voluntary cancellation keeps access until the paid period ends.
    await sbAdmin()
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', key);
  }

  await auditPartner(
    args.provider,
    data?.user_id ?? null,
    args.immediate ? 'subscription_revoked' : 'cancel_scheduled',
    args.env,
    { ref: args.providerRef },
  );
}

/** Reads a postback payload from either a form body or the query string. */
export async function readPostback(request: Request): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URL(request.url).searchParams) out[k] = v;
  if (request.method === 'POST') {
    const ct = request.headers.get('content-type') ?? '';
    const body = await request.text();
    if (body) {
      if (ct.includes('application/json')) {
        try {
          const parsed = JSON.parse(body) as Record<string, unknown>;
          for (const [k, v] of Object.entries(parsed)) out[k] = String(v ?? '');
        } catch {
          /* ignore malformed json */
        }
      } else {
        for (const [k, v] of new URLSearchParams(body)) out[k] = v;
      }
    }
  }
  return out;
}
