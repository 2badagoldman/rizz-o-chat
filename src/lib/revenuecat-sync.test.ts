import { expect, it } from "vitest";
import { revenueCatSyncBody, verifiedRevenueCatSubscriptions } from "./revenuecat-sync";

const now = Date.parse("2026-10-19T04:31:00Z");
function snapshot(product: string, extra: Record<string, unknown> = {}) {
  return { subscriber: { subscriptions: { [product]: { purchase_date: "2026-10-18T00:00:00Z", expires_date: "2026-11-18T00:00:00Z", is_sandbox: false, ...extra } } } };
}
it("maps Android base-plan suffix to Gold", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_gold_weekly:weekly"), now)[0]).toMatchObject({ priceId: "rizz_gold_weekly", tier: "plus", active: true, environment: "live" }));
it("verifies Diamond monthly subscription", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_diamond_weekly:monthly"), now)[0]).toMatchObject({ priceId: "rizz_diamond_weekly", tier: "vip", active: true }));
it("does not authorize expired purchases", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_gold_weekly", { expires_date: "2026-10-19T04:31:00Z" }), now)[0]?.active).toBe(false));
it("does not authorize refunded purchases", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_gold_weekly", { refunded_at: "2026-10-19T00:00:00Z" }), now)[0]?.active).toBe(false));
it("keeps cancelled subscriptions through the paid period", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_gold_weekly", { unsubscribe_detected_at: "2026-10-19T00:00:00Z" }), now)[0]).toMatchObject({ active: true, cancelAtPeriodEnd: true }));
it("keeps sandbox and live distinct", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_gold_weekly", { is_sandbox: true }), now)[0]?.environment).toBe("sandbox"));
it("never treats coins as subscription grants", () => expect(verifiedRevenueCatSubscriptions(snapshot("crush_coins_500"), now)).toEqual([]));
it("ignores unknown subscription products", () => expect(verifiedRevenueCatSubscriptions(snapshot("unknown"), now)).toEqual([]));
it("rejects invalid sync identities", () => expect(revenueCatSyncBody.safeParse({ userId: "someone", activeEntitlements: [] }).success).toBe(false));