import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  purchasePackage: vi.fn(), restorePurchases: vi.fn(),
  getSession: vi.fn(), fetch: vi.fn(),
}));
vi.mock("@/lib/native", () => ({ isNativeApp: () => true, nativePlatform: () => "android" }));
vi.mock("@/lib/revenuecat.keys", () => ({ REVENUECAT_ANDROID_PUBLIC_KEY: "goog_public", REVENUECAT_IOS_PUBLIC_KEY: "appl_public", REVENUECAT_TEST_STORE_KEY: "test_public" }));
vi.mock("@revenuecat/purchases-capacitor", () => ({ Purchases: mocks }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.getSession } } }));

import { RC_PRODUCTS, RC_COIN_PRODUCTS, RC_SUBSCRIPTION_PRODUCTS, purchaseRevenueCatPackage, restoreRevenueCatPurchases } from "./revenuecat";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "member-id" }, access_token: "test-session" } } });
  mocks.fetch.mockResolvedValue(new Response());
});

describe("RevenueCat store product rules", () => {
  it("maps Gold to crush_gold_weekly", () => expect(RC_PRODUCTS.rizz_gold_weekly).toBe("crush_gold_weekly"));
  it("maps monthly Diamond to the weekly-named store product", () => expect(RC_PRODUCTS.rizz_diamond_weekly).toBe("crush_diamond_weekly"));
  for (const amount of [500, 1500, 5000, 15000] as const) {
    it(`maps the ${amount}-coin consumable`, () => expect(RC_PRODUCTS[`coins_${amount}_onetime`]).toBe(`crush_coins_${amount}`));
  }
  it("exports only the four consumables", () => expect(RC_COIN_PRODUCTS).toEqual(["crush_coins_500", "crush_coins_1500", "crush_coins_5000", "crush_coins_15000"]));
  it("exports only the two subscriptions", () => expect(RC_SUBSCRIPTION_PRODUCTS).toEqual(["crush_gold_weekly", "crush_diamond_weekly"]));
});

it("notifies the authenticated backend without blocking purchase success", async () => {
  mocks.purchasePackage.mockResolvedValue({ customerInfo: { entitlements: { active: { "Crush Pro": {} } } } });
  mocks.fetch.mockImplementation(() => new Promise(() => {}));
  const result = await purchaseRevenueCatPackage({ identifier: "gold", productIdentifier: "crush_gold_weekly", priceString: "$9.99", raw: {} });
  expect(result).toEqual({ status: "success", activeEntitlements: ["Crush Pro"] });
  await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith("https://rizzlachat.com/api/public/payments/revenuecat/sync", expect.objectContaining({
    method: "POST", body: JSON.stringify({ userId: "member-id", activeEntitlements: ["Crush Pro"] }),
    headers: { "Content-Type": "application/json", Authorization: "Bearer test-session" },
  })));
});

it("does not fail a restore when notification fails", async () => {
  mocks.restorePurchases.mockResolvedValue({ customerInfo: { entitlements: { active: {} } } });
  mocks.fetch.mockRejectedValue(new Error("offline"));
  expect(await restoreRevenueCatPurchases()).toEqual({ status: "success", activeEntitlements: [] });
  await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalled());
});

it("does not notify the backend for a cancelled purchase", async () => {
  mocks.purchasePackage.mockRejectedValue({ userCancelled: true });
  expect((await purchaseRevenueCatPackage({ identifier: "gold", productIdentifier: "crush_gold_weekly", priceString: "", raw: {} })).status).toBe("cancelled");
  expect(mocks.getSession).not.toHaveBeenCalled();
});