import { z } from "zod";

export const revenueCatSyncBody = z.object({
  userId: z.uuid(),
  activeEntitlements: z.array(z.string().max(200)).max(50),
});

const storeSubscription = z.object({
  expires_date: z.iso.datetime({ offset: true }).nullable(),
  purchase_date: z.iso.datetime({ offset: true }),
  is_sandbox: z.boolean(),
  unsubscribe_detected_at: z.string().nullable().optional(),
  refunded_at: z.string().nullable().optional(),
});

export const revenueCatSubscriber = z.object({
  subscriber: z.object({ subscriptions: z.record(z.string(), storeSubscription) }),
});

export function verifiedRevenueCatSubscriptions(payload: unknown, now = Date.now()) {
  const { subscriber } = revenueCatSubscriber.parse(payload);
  return Object.entries(subscriber.subscriptions).flatMap(([productId, subscription]) => {
    const base = productId.split(":")[0];
    const priceId = base === "crush_gold_weekly" ? "rizz_gold_weekly" : base === "crush_diamond_weekly" ? "rizz_diamond_weekly" : null;
    if (!priceId) return [];
    const active = !subscription.refunded_at && (subscription.expires_date === null || Date.parse(subscription.expires_date) > now);
    return [{
      productId,
      priceId,
      active,
      tier: priceId === "rizz_diamond_weekly" ? "vip" as const : "plus" as const,
      environment: subscription.is_sandbox ? "sandbox" as const : "live" as const,
      started: subscription.purchase_date,
      expires: subscription.expires_date,
      cancelAtPeriodEnd: Boolean(subscription.unsubscribe_detected_at),
    }];
  });
}