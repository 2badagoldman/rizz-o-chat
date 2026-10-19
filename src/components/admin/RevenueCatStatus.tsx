import { Loader2, RotateCcw, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { isRevenueCatTestStore } from "@/lib/revenuecat";

export function RevenueCatStatus() {
  const { isAdmin, loading } = useIsAdmin();
  if (loading || !isAdmin) return null;
  return <RevenueCatStatusCard />;
}

function RevenueCatStatusCard() {
  const { available, ready, busy, packages, restore } = useRevenueCat();
  return (
    <section aria-label="RevenueCat status" className="mt-5 rounded-lg border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Store className="h-4 w-4 text-primary" />RevenueCat status</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Device</dt><dd>{available ? "Native · available" : "Web · store billing unavailable"}</dd></div>
        <div><dt className="text-muted-foreground">Billing mode</dt><dd>{!available ? "Not applicable" : isRevenueCatTestStore() ? "Test Store · sandbox" : "Live store SDK · purchase environment set by store"}</dd></div>
      </dl>
      <ul className="mt-3 space-y-2 text-sm">
        {Object.values(packages).map((pkg) => <li key={pkg.productIdentifier} className="flex flex-wrap justify-between gap-2"><span className="break-all font-mono text-xs">{pkg.productIdentifier}</span><span>{pkg.priceString || "Price unavailable"}</span></li>)}
      </ul>
      {Object.keys(packages).length === 0 && <p className="mt-3 text-sm text-muted-foreground">{available && !ready ? "Waiting for store packages…" : "No packages loaded."}</p>}
      {available && <Button variant="outline" className="mt-4" disabled={!ready || busy !== null} onClick={async () => {
        const result = await restore();
        if (result.status === "success") toast.success("Purchases restored.");
        else if (result.status === "error") toast.error(result.message);
      }}>{busy === "restore" ? <Loader2 className="animate-spin" /> : <RotateCcw />}Restore Purchases</Button>}
    </section>
  );
}