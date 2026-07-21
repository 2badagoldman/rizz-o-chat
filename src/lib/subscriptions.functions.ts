import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';

type Result = { ok: true } | { error: string };

async function ownedSub(supabase: any, userId: string, subscriptionId: string, env: StripeEnv) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscriptionId)
    .eq('environment', env)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export const cancelSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { subscriptionId: string; environment: StripeEnv }) => {
    if (!/^sub_[A-Za-z0-9]+$/.test(data.subscriptionId)) throw new Error('Invalid subscriptionId');
    return data;
  })
  .handler(async ({ data, context }): Promise<Result> => {
    try {
      const { supabase, userId } = context;
      if (!(await ownedSub(supabase, userId, data.subscriptionId, data.environment))) {
        return { error: 'Subscription not found' };
      }
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(data.subscriptionId, { cancel_at_period_end: true });
      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const resumeSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { subscriptionId: string; environment: StripeEnv }) => {
    if (!/^sub_[A-Za-z0-9]+$/.test(data.subscriptionId)) throw new Error('Invalid subscriptionId');
    return data;
  })
  .handler(async ({ data, context }): Promise<Result> => {
    try {
      const { supabase, userId } = context;
      if (!(await ownedSub(supabase, userId, data.subscriptionId, data.environment))) {
        return { error: 'Subscription not found' };
      }
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(data.subscriptionId, { cancel_at_period_end: false });
      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// Send a coin-based gift in-chat. Atomically debits sender, credits host 65%.
export const sendChatGift = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { hostId: string; coins: number; label: string }) => {
    if (!/^[a-f0-9-]{36}$/i.test(data.hostId)) throw new Error('Invalid hostId');
    if (!Number.isInteger(data.coins) || data.coins < 10 || data.coins > 100000) {
      throw new Error('Coin amount out of range');
    }
    if (typeof data.label !== 'string' || data.label.length > 32) throw new Error('Invalid label');
    return data;
  })
  .handler(async ({ data, context }): Promise<{ ok: true; balance: number } | { error: string; code?: string }> => {
    const { supabase, userId } = context;
    const { data: res, error } = await supabase.rpc('send_coin_gift', {
      _sender: userId,
      _host: data.hostId,
      _coins: data.coins,
      _label: data.label,
    });
    if (error) return { error: error.message };
    const r = res as { ok: boolean; error?: string; balance?: number };
    if (!r.ok) return { error: r.error ?? 'gift_failed', code: r.error };
    return { ok: true, balance: r.balance ?? 0 };
  });
