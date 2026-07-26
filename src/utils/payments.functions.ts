import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';

type CheckoutResult = { clientSecret: string } | { error: string };
type PortalResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const c = existing.data[0];
      if (options.userId && c.metadata?.userId !== options.userId) {
        await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId: options.userId } });
      }
      return c.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

// ---- Fixed-price checkout: coin packs, Rizz Gold, Rizz Diamond VIP ----
export const createCheckoutSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error('Invalid priceId');
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, supabase } = context;
      const { data: { user } } = await supabase.auth.getUser();
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error('Price not found');
      const price = prices.data[0];
      const isRecurring = price.type === 'recurring';

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId,
      });

      let productDescription: string | undefined;
      if (!isRecurring) {
        const pid = typeof price.product === 'string' ? price.product : price.product.id;
        const product = await stripe.products.retrieve(pid);
        productDescription = product.name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: isRecurring ? 'subscription' : 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        metadata: { userId, kind: 'catalog', priceLookupKey: data.priceId },
        ...(isRecurring && {
          subscription_data: { metadata: { userId, kind: 'platform', priceLookupKey: data.priceId } },
        }),
      });
      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---- Dynamic per-host Friends List subscription ----
export const createFriendsListCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    hostId: string;
    hostName: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-f0-9-]{36}$/.test(data.hostId)) throw new Error('Invalid hostId');
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, supabase } = context;

      // GATE: Friends Lists can only be unlocked by Rizz Gold (or VIP) members.
      const { data: me, error: meErr } = await supabase
        .from('profiles')
        .select('platform_tier')
        .eq('id', userId)
        .maybeSingle();
      if (meErr) throw new Error(meErr.message);
      const tier = me?.platform_tier ?? 'free';
      if (tier !== 'plus' && tier !== 'vip') {
        return { error: 'Rizz Gold required — upgrade to Rizz Gold to unlock any Friends List.' };
      }

      // SECURITY: look up the host's real listed price server-side; never trust
      // a price sent by the client. This prevents a member from paying $0.99
      // for a Friends List priced at $99.99.
      const { data: list, error: listErr } = await supabase
        .from('friends_lists')
        .select('price_cents')
        .eq('host_id', data.hostId)
        .maybeSingle();
      if (listErr) throw new Error(listErr.message);
      if (!list) return { error: 'This host does not have a Friends List available.' };
      const priceCents = list.price_cents;
      if (!Number.isInteger(priceCents) || priceCents < 99 || priceCents > 9999) {
        return { error: 'Host price is out of range.' };
      }

      const { data: { user } } = await supabase.auth.getUser();
      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId,
      });
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Friends List — ${data.hostName}` },
            unit_amount: priceCents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId, kind: 'friends_list', hostId: data.hostId, priceCents: String(priceCents) },
        subscription_data: {
          metadata: { userId, kind: 'friends_list', hostId: data.hostId, priceCents: String(priceCents) },
        },
      });
      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---- Dynamic-amount gift tip to a host ----
export const createTipCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    hostId: string;
    hostName: string;
    amountCents: number;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-f0-9-]{36}$/.test(data.hostId)) throw new Error('Invalid hostId');
    if (data.amountCents < 100 || data.amountCents > 50000) throw new Error('Tip amount out of range ($1–$500)');
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, supabase } = context;
      const { data: { user } } = await supabase.auth.getUser();
      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId,
      });
      const description = `Tip to ${data.hostName}`;
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: description },
            unit_amount: data.amountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: { description },
        metadata: { userId, kind: 'tip', hostId: data.hostId, amountCents: String(data.amountCents) },
      });
      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---- Customer portal ----
export const createPortalSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('environment', data.environment)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: 'No subscription found' };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
