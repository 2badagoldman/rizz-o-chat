/**
 * RevenueCat — alternative payment rail to Stripe.
 *
 * RevenueCat brokers Apple App Store and Google Play in-app purchases, which
 * are international, instant and completely independent of Stripe. If Stripe
 * checkout is ever down (or a card is declined by a regional issuer), members
 * can complete the exact same purchase through their store account.
 *
 * Everything here is a safe no-op in the browser: the native plugin is only
 * imported dynamically inside a Capacitor build, so the deployed web app is
 * never affected.
 */
import { isNativeApp, nativePlatform } from "@/lib/native";
import {
  REVENUECAT_ANDROID_PUBLIC_KEY,
  REVENUECAT_IOS_PUBLIC_KEY,
  REVENUECAT_TEST_STORE_KEY,
} from "@/lib/revenuecat.keys";

/** Store product identifiers — must match the products created in App Store
 *  Connect / Google Play and attached to the RevenueCat offering.
 *  The live RevenueCat "Crush" project's Default offering uses the
 *  `crush_*` identifiers: `crush_gold_weekly` = Gold tier,
 *  `crush_diamond_weekly` = Diamond VIP tier (named "weekly" in RevenueCat,
 *  but it is the premium tier). Coin packs use `crush_coins_*`. */
export const RC_PRODUCTS = {
  /** crush_gold_weekly: Gold subscription, weekly billing. */
  rizz_gold_weekly: "crush_gold_weekly",
  /** crush_diamond_weekly: Diamond VIP, monthly billing despite the RC name. */
  rizz_diamond_weekly: "crush_diamond_weekly",
  /** crush_coins_500: one-time consumable, 500 coins. */
  coins_500_onetime: "crush_coins_500",
  /** crush_coins_1500: one-time consumable, 1,500 coins. */
  coins_1500_onetime: "crush_coins_1500",
  /** crush_coins_5000: one-time consumable, 5,000 coins. */
  coins_5000_onetime: "crush_coins_5000",
  /** crush_coins_15000: one-time consumable, 15,000 coins. */
  coins_15000_onetime: "crush_coins_15000",
} as const;

export const RC_COIN_PRODUCTS = [RC_PRODUCTS.coins_500_onetime, RC_PRODUCTS.coins_1500_onetime, RC_PRODUCTS.coins_5000_onetime, RC_PRODUCTS.coins_15000_onetime] as const;
export const RC_SUBSCRIPTION_PRODUCTS = [RC_PRODUCTS.rizz_gold_weekly, RC_PRODUCTS.rizz_diamond_weekly] as const;

export type CrushPriceId = keyof typeof RC_PRODUCTS;

/** Reverse map: store product identifier -> internal Crush price id. */
export const RC_PRODUCT_TO_PRICE_ID: Record<string, CrushPriceId> = Object.fromEntries(
  Object.entries(RC_PRODUCTS).map(([k, v]) => [v, k as CrushPriceId]),
) as Record<string, CrushPriceId>;

export type RcPackage = {
  identifier: string;
  productIdentifier: string;
  priceString: string;
  /** Opaque package object handed straight back to the plugin on purchase. */
  raw: unknown;
};

function apiKey(): string | null {
  const platform = nativePlatform();
  // Test Store key is a sandbox-only fallback used until the real store apps
  // are configured in RevenueCat.
  const fallback = REVENUECAT_TEST_STORE_KEY || null;
  if (platform === "ios")
    return import.meta.env.VITE_REVENUECAT_IOS_KEY || REVENUECAT_IOS_PUBLIC_KEY || fallback;
  if (platform === "android")
    return import.meta.env.VITE_REVENUECAT_ANDROID_KEY || REVENUECAT_ANDROID_PUBLIC_KEY || fallback;
  return null;
}

/** True when only the sandbox Test Store key is configured (no real billing). */
export function isRevenueCatTestStore(): boolean {
  return apiKey() === REVENUECAT_TEST_STORE_KEY;
}

/** True when a RevenueCat purchase can actually be started on this device. */
export function isRevenueCatAvailable(): boolean {
  return isNativeApp() && Boolean(apiKey());
}

let configured = false;

async function plugin() {
  // Intentional lazy loading/tree-shaking: the native SDK stays out of the initial web bundle.
  const mod = await import("@revenuecat/purchases-capacitor");
  return mod.Purchases;
}

/** Configure the SDK once, identified by the Crush user id so webhooks can
 *  attribute the purchase to the right account. */
export async function initRevenueCat(userId: string | null): Promise<boolean> {
  if (!isRevenueCatAvailable()) return false;
  const key = apiKey();
  if (!key) return false;
  try {
    const Purchases = await plugin();
    if (!configured) {
      await Purchases.configure({ apiKey: key, appUserID: userId ?? undefined });
      configured = true;
    } else if (userId) {
      await Purchases.logIn({ appUserID: userId });
    }
    return true;
  } catch (err) {
    console.error("RevenueCat configure failed", err);
    return false;
  }
}

/** Load the current offering's packages, keyed by store product identifier. */
export async function loadRevenueCatPackages(): Promise<Record<string, RcPackage>> {
  if (!isRevenueCatAvailable()) return {};
  try {
    const Purchases = await plugin();
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const out: Record<string, RcPackage> = {};
    for (const p of packages) {
      const productIdentifier = p.product?.identifier;
      if (!productIdentifier) continue;
      out[productIdentifier] = {
        identifier: p.identifier,
        productIdentifier,
        priceString: p.product?.priceString ?? "",
        raw: p,
      };
    }
    return out;
  } catch (err) {
    console.error("RevenueCat offerings failed", err);
    return {};
  }
}

export type RcPurchaseResult =
  | { status: "success"; activeEntitlements: string[] }
  | { status: "cancelled" }
  | { status: "error"; message: string };

/** Best-effort authenticated sync; client entitlements are hints, never proof of payment. */
async function notifyBackend(activeEntitlements: string[]): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return;
  await fetch("https://rizzlachat.com/api/public/payments/revenuecat/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ userId: session.user.id, activeEntitlements }),
  });
}

export async function purchaseRevenueCatPackage(pkg: RcPackage): Promise<RcPurchaseResult> {
  if (!isRevenueCatAvailable()) return { status: "error", message: "Store billing unavailable" };
  try {
    const Purchases = await plugin();
    const res = await Purchases.purchasePackage({ aPackage: pkg.raw as never });
    const activeEntitlements = Object.keys(res.customerInfo?.entitlements?.active ?? {});
    void notifyBackend(activeEntitlements).catch(() => {});
    return {
      status: "success",
      activeEntitlements,
    };
  } catch (err) {
    const e = err as { code?: string | number; userCancelled?: boolean; message?: string };
    if (e?.userCancelled || String(e?.code) === "1") return { status: "cancelled" };
    return { status: "error", message: e?.message ?? "Purchase failed" };
  }
}

/** Re-sync purchases made on another device / after a reinstall. */
export async function restoreRevenueCatPurchases(): Promise<RcPurchaseResult> {
  if (!isRevenueCatAvailable()) return { status: "error", message: "Store billing unavailable" };
  try {
    const Purchases = await plugin();
    const res = await Purchases.restorePurchases();
    const activeEntitlements = Object.keys(res.customerInfo?.entitlements?.active ?? {});
    void notifyBackend(activeEntitlements).catch(() => {});
    return {
      status: "success",
      activeEntitlements,
    };
  } catch (err) {
    return { status: "error", message: (err as Error)?.message ?? "Restore failed" };
  }
}
