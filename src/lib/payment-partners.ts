/**
 * Alternative payment partners (client-safe catalog).
 *
 * Stripe stays the primary rail. Each partner below renders as an extra
 * "pay with…" button on /upgrade and /coins. A partner only appears once its
 * credentials are configured on the server (see getPartnerStatus).
 */

export type PartnerId = 'ccbill' | 'segpay' | 'epoch' | 'cashapp' | 'revenuecat';

export type PartnerMeta = {
  id: PartnerId;
  label: string;
  blurb: string;
  /** hosted = redirect to partner-hosted order form; stripe = inside our Stripe checkout; native = app store */
  kind: 'hosted' | 'stripe' | 'native';
  supports: Array<'subscription' | 'onetime'>;
};

export const PAYMENT_PARTNERS: PartnerMeta[] = [
  {
    id: 'cashapp',
    label: 'Cash App Pay',
    blurb: 'Scan and confirm in Cash App — no card needed.',
    kind: 'stripe',
    supports: ['subscription', 'onetime'],
  },
  {
    id: 'ccbill',
    label: 'CCBill',
    blurb: 'Global cards, wallets and local methods on a CCBill-hosted form.',
    kind: 'hosted',
    supports: ['subscription', 'onetime'],
  },
  {
    id: 'segpay',
    label: 'SegPay',
    blurb: 'Cards and bank options with EU/UK coverage.',
    kind: 'hosted',
    supports: ['subscription', 'onetime'],
  },
  {
    id: 'epoch',
    label: 'Epoch',
    blurb: '90+ currencies and alternative local payment methods.',
    kind: 'hosted',
    supports: ['subscription', 'onetime'],
  },
  {
    id: 'revenuecat',
    label: 'Secure Checkout',
    blurb: 'RevenueCat-hosted checkout — cards and wallets, on web and in the app.',
    kind: 'hosted',
    supports: ['subscription', 'onetime'],
  },
];

export type CatalogItem = {
  priceId: string;
  name: string;
  amountCents: number;
  currency: 'usd';
  kind: 'subscription' | 'onetime';
  /** recurring plans only (billing period length in days) */
  intervalDays?: number;
  coins?: number;
  tier?: 'plus' | 'vip';
};

/** Single source of truth every rail (Stripe, RevenueCat, CCBill, SegPay, Epoch) maps onto. */
export const CATALOG: Record<string, CatalogItem> = {
  rizz_gold_weekly: {
    priceId: 'rizz_gold_weekly',
    name: 'Crush Gold',
    amountCents: 999,
    currency: 'usd',
    kind: 'subscription',
    intervalDays: 30,
    tier: 'plus',
  },
  rizz_diamond_weekly: {
    priceId: 'rizz_diamond_weekly',
    name: 'Crush Diamond VIP',
    amountCents: 2499,
    currency: 'usd',
    kind: 'subscription',
    intervalDays: 30,
    tier: 'vip',
    coins: 2000,
  },
  coins_500_onetime: { priceId: 'coins_500_onetime', name: '500 coins', amountCents: 499, currency: 'usd', kind: 'onetime', coins: 500 },
  coins_1500_onetime: { priceId: 'coins_1500_onetime', name: '1,500 coins', amountCents: 999, currency: 'usd', kind: 'onetime', coins: 1500 },
  coins_5000_onetime: { priceId: 'coins_5000_onetime', name: '5,000 coins', amountCents: 2499, currency: 'usd', kind: 'onetime', coins: 5000 },
  coins_15000_onetime: { priceId: 'coins_15000_onetime', name: '15,000 coins', amountCents: 4999, currency: 'usd', kind: 'onetime', coins: 16500 },
};

export type PartnerStatus = { id: PartnerId; enabled: boolean; primary: boolean };

/** Which rail is the live card processor right now. `stripe` is the legacy rail. */
export type PrimaryRail = PartnerId | 'stripe';

/**
 * Order we promote hosted high-risk processors in. Stripe closed the account
 * for "online dating and matchmaking" (no new payments after 2026-09-03), so
 * the first configured processor below takes over as the single card rail.
 */
export const HOSTED_RAIL_PRIORITY: PartnerId[] = ['revenuecat', 'ccbill', 'segpay', 'epoch'];

/** Last day Stripe accepts new payments on this account. */
export const STRIPE_SUNSET_ISO = '2026-09-03';

export function stripeStillAccepting(now: Date = new Date()): boolean {
  return now < new Date(`${STRIPE_SUNSET_ISO}T23:59:59Z`);
}

export type PaymentRails = {
  partners: PartnerStatus[];
  /** The one rail shown at checkout. Backups stay hidden until promoted. */
  primary: PrimaryRail;
  stripeAccepting: boolean;
};
