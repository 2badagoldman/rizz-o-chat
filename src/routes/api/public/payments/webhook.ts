import { createFileRoute } from '@tanstack/react-router';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';
import type { Database } from '@/integrations/supabase/types';

let _sb: SupabaseClient<Database> | null = null;
function sb(): SupabaseClient<Database> {
  if (!_sb) {
    _sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

const COIN_PACKS: Record<string, number> = {
  coins_500_onetime: 500,
  coins_1500_onetime: 1500,
  coins_5000_onetime: 5000,
  coins_15000_onetime: 15000,
};

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) return console.error('subscription missing userId');
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const hostId = subscription.metadata?.hostId || null;

  await sb().from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    host_id: hostId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const kind = subscription.metadata?.kind;

  if (kind === 'platform' && isActive) {
    const tier = priceId === 'rizz_vip_monthly' ? 'vip' : priceId === 'rizz_plus_monthly' ? 'plus' : 'free';
    await sb().from('profiles').update({ platform_tier: tier }).eq('id', userId);
  } else if (kind === 'platform' && !isActive) {
    await sb().from('profiles').update({ platform_tier: 'free' }).eq('id', userId);
  }

  if (kind === 'friends_list' && hostId && isActive) {
    const priceCents = Number(subscription.metadata?.priceCents ?? 0) || (item?.price?.unit_amount ?? 0);
    await sb().rpc('grant_friends_list_access', {
      _member_id: userId,
      _host_id: hostId,
      _price_cents: priceCents,
    });
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await sb().from('subscriptions').update({
    status: 'canceled',
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscription.id).eq('environment', env);

  const userId = subscription.metadata?.userId;
  const kind = subscription.metadata?.kind;
  const hostId = subscription.metadata?.hostId;

  if (kind === 'platform' && userId) {
    await sb().from('profiles').update({ platform_tier: 'free' }).eq('id', userId);
  }
  if (kind === 'friends_list' && userId && hostId) {
    // 30-minute chat access grace period
    await sb().rpc('friends_list_grace_end', { _member_id: userId, _host_id: hostId });
  }
}

async function handleCheckoutCompleted(session: any) {
  if (session.mode !== 'payment') return; // subscription flows are handled by subscription events
  const meta = session.metadata || {};
  const userId = meta.userId;
  if (!userId) return;

  // Coin pack
  if (meta.kind === 'catalog' && meta.priceLookupKey && COIN_PACKS[meta.priceLookupKey]) {
    let coins = COIN_PACKS[meta.priceLookupKey];
    if (meta.priceLookupKey === 'coins_15000_onetime') coins = Math.floor(coins * 1.1); // 10% bonus
    await sb().rpc('credit_coins', { _user_id: userId, _coins: coins });
    return;
  }

  // Tip
  if (meta.kind === 'tip' && meta.hostId) {
    const gross = Number(meta.amountCents ?? 0) || session.amount_total || 0;
    const hostShare = Math.floor(gross * 0.65);
    await sb().from('earnings_ledger').insert({
      host_id: meta.hostId,
      member_id: userId,
      source: 'tip',
      gross_cents: gross,
      host_share_cents: hostShare,
    });
    await sb().from('gifts').insert({
      host_id: meta.hostId,
      sender_id: userId,
      amount_cents: gross,
    }).then(() => {}, () => {}); // best-effort; ignore if schema differs
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
              await handleSubscriptionUpsert(event.data.object, env);
              break;
            case 'customer.subscription.deleted':
              await handleSubscriptionDeleted(event.data.object, env);
              break;
            case 'checkout.session.completed':
              await handleCheckoutCompleted(event.data.object);
              break;
            default:
              console.log('Unhandled event:', event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
