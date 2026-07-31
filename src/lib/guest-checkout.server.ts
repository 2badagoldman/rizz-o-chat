import { type StripeEnv, createStripeClient } from '@/lib/stripe.server';

// Server-only helpers shared by the guest-subscription server functions.

export type GuestRow = {
  id: string;
  code: string;
  email: string | null;
  phone: string | null;
  price_id: string;
  status: string;
  environment: string;
  claimed_by: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
};

export function tierFor(priceId: string): 'plus' | 'vip' {
  return priceId === 'rizz_diamond_weekly' || priceId === 'rizz_vip_monthly' ? 'vip' : 'plus';
}

/** Digits-only E.164-ish normalisation so "(555) 123-4567" matches "+15551234567". */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return `+${digits.length === 10 ? `1${digits}` : digits}`;
}

/**
 * Attach a paid guest subscription row to a real account: point Stripe at the
 * user, mirror the subscription locally and lift their platform tier.
 */
export async function redeemGuestRow(
  row: GuestRow,
  userId: string,
): Promise<{ ok: true; tier: 'plus' | 'vip' } | { error: string }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  if (row.claimed_by && row.claimed_by !== userId) {
    return { error: 'This code has already been claimed by another account.' };
  }
  if (!row.stripe_subscription_id) {
    return { error: 'This payment is still processing — try again in a minute.' };
  }

  const rowEnv: StripeEnv = row.environment === 'live' ? 'live' : 'sandbox';
  const stripe = createStripeClient(rowEnv);
  const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
  const active = subscription.status === 'active' || subscription.status === 'trialing';
  if (!active) return { error: 'That subscription is no longer active.' };

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
      environment: rowEnv,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );
  if (upErr) return { error: upErr.message };

  await supabaseAdmin.from('profiles').update({ platform_tier: tier }).eq('id', userId);
  await supabaseAdmin
    .from('guest_subscriptions')
    .update({ claimed_by: userId, claimed_at: new Date().toISOString(), status: subscription.status })
    .eq('id', row.id);

  return { ok: true, tier };
}

/** Find an unclaimed guest subscription that belongs to this account's email or phone. */
export async function findGuestRowForUser(userId: string): Promise<GuestRow | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = authUser?.user;
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const emails = new Set<string>();
  if (user.email) emails.add(user.email.toLowerCase());
  if (typeof meta.contact_email === 'string') emails.add(meta.contact_email.toLowerCase());

  const phones = new Set<string>();
  for (const candidate of [user.phone, meta.phone]) {
    if (typeof candidate === 'string' && candidate) {
      const norm = normalizePhone(candidate);
      if (norm) phones.add(norm);
    }
  }

  const filters: string[] = [];
  if (emails.size) filters.push(`email.in.(${[...emails].map((e) => `"${e}"`).join(',')})`);
  if (phones.size) filters.push(`phone.in.(${[...phones].map((p) => `"${p}"`).join(',')})`);
  if (!filters.length) return null;

  const { data } = await supabaseAdmin
    .from('guest_subscriptions')
    .select('*')
    .is('claimed_by', null)
    .not('stripe_subscription_id', 'is', null)
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .limit(1);

  return (data?.[0] as GuestRow | undefined) ?? null;
}
