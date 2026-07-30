import { ShieldCheck, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import type { CrushPriceId } from "@/lib/revenuecat";

/**
 * Alternative payment rail shown next to Stripe checkout.
 *
 * Purchases run through the App Store / Google Play account (brokered by
 * RevenueCat), so members always have a second, international way to pay if
 * card checkout is unavailable.
 */
export function RevenueCatPurchase({
  priceId,
  label,
  onSuccess,
  webNote = true,
}: {
  priceId: CrushPriceId;
  label: string;
  onSuccess?: () => void;
  /** Show the "available in the mobile app" hint on web. Turn off when the
   *  page renders many purchase rows and only needs the hint once. */
  webNote?: boolean;
}) {
  const { available, ready, busy, packageFor, purchase, restore } = useRevenueCat();

  if (!available) {
    if (!webNote) return null;
    return (
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Store className="h-3 w-3 shrink-0" />
        Prefer store billing? The same plan is available through the App Store or Google Play in the
        Crush mobile app.
      </p>
    );
  }

  const pkg = packageFor(priceId);
  const working = busy === priceId;

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        disabled={!ready || !pkg || working}
        onClick={async () => {
          const res = await purchase(priceId);
          if (res.status === "success") {
            toast.success("Purchase complete — your account is updating now.");
            onSuccess?.();
          } else if (res.status === "error") {
            toast.error(res.message);
          }
        }}
        className="press-spring flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background/70 px-5 py-3 text-sm font-bold backdrop-blur-xl transition disabled:opacity-50"
      >
        {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
        {working ? "Processing…" : `${label}${pkg?.priceString ? ` · ${pkg.priceString}` : ""}`}
      </button>
      <button
        type="button"
        disabled={busy === "restore"}
        onClick={async () => {
          const res = await restore();
          if (res.status === "success") toast.success("Purchases restored.");
          else if (res.status === "error") toast.error(res.message);
        }}
        className="w-full text-center text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
      >
        Restore previous purchases
      </button>
    </div>
  );
}
