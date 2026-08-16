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
 *  Connect / Google Play and attached to the RevenueCat offering. */
export const RC_PRODUCTS = {
  rizz_gold_weekly: "crush_gold_weekly",
  rizz_diamond_weekly: "crush_diamond_weekly",
  coins_500_onetime: "crush_coins_500",
  coins_1500_onetime: "crush_coins_1500",
  coins_5000_onetime: "crush_coins_5000",
  coins_15000_onetime: "crush_coins_15000",
} as const;

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
  if (platform === "ios")
    return import.meta.env.VITE_REVENUECAT_IOS_KEY || REVENUECAT_IOS_PUBLIC_KEY || null;
  if (platform === "android")
    return import.meta.env.VITE_REVENUECAT_ANDROID_KEY || REVENUECAT_ANDROID_PUBLIC_KEY || null;
  return null;
}

/** True when a RevenueCat purchase can actually be started on this device. */
export function isRevenueCatAvailable(): boolean {
  return isNativeApp() && Boolean(apiKey());
}

let configured = false;

async function plugin() {
  const mod = await import("@revenuecat/purchases-capacitor");
  return mod.Purchases;
}

/** Configure the SDK once, identified by the Crush user id so webhooks can
 *  attribute the purchase to the right account. */
export async function initRevenueCat(userId: string | null): Promise<boolean> {
  if (!isRevenueCatAvailable()) return false;
  try {
    const Purchases = await plugin();
    if (!configured) {
      await Purchases.configure({ apiKey: apiKey()!, appUserID: userId ?? undefined });
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

export async function purchaseRevenueCatPackage(pkg: RcPackage): Promise<RcPurchaseResult> {
  if (!isRevenueCatAvailable()) return { status: "error", message: "Store billing unavailable" };
  try {
    const Purchases = await plugin();
    const res = await Purchases.purchasePackage({ aPackage: pkg.raw as never });
    return {
      status: "success",
      activeEntitlements: Object.keys(res.customerInfo?.entitlements?.active ?? {}),
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
    return {
      status: "success",
      activeEntitlements: Object.keys(res.customerInfo?.entitlements?.active ?? {}),
    };
  } catch (err) {
    return { status: "error", message: (err as Error)?.message ?? "Restore failed" };
  }
}
