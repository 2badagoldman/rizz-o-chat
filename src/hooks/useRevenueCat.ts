import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  initRevenueCat,
  isRevenueCatAvailable,
  loadRevenueCatPackages,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  RC_PRODUCTS,
  type CrushPriceId,
  type RcPackage,
} from "@/lib/revenuecat";

/**
 * Store billing (RevenueCat) as an alternative to Stripe. Always safe to call:
 * on the web `available` is false and every action is a no-op.
 */
export function useRevenueCat() {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [packages, setPackages] = useState<Record<string, RcPackage>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isRevenueCatAvailable()) return;
    (async () => {
      const ok = await initRevenueCat(user?.id ?? null);
      if (!ok || cancelled) return;
      const pkgs = await loadRevenueCatPackages();
      if (cancelled) return;
      setPackages(pkgs);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const packageFor = useCallback(
    (priceId: CrushPriceId) => packages[RC_PRODUCTS[priceId]] ?? null,
    [packages],
  );

  const purchase = useCallback(
    async (priceId: CrushPriceId) => {
      const pkg = packages[RC_PRODUCTS[priceId]];
      if (!pkg) return { status: "error" as const, message: "This item isn’t available in the store yet." };
      setBusy(priceId);
      try {
        return await purchaseRevenueCatPackage(pkg);
      } finally {
        setBusy(null);
      }
    },
    [packages],
  );

  const restore = useCallback(async () => {
    setBusy("restore");
    try {
      return await restoreRevenueCatPurchases();
    } finally {
      setBusy(null);
    }
  }, []);

  return {
    available: isRevenueCatAvailable(),
    ready,
    busy,
    packageFor,
    purchase,
    restore,
  };
}
