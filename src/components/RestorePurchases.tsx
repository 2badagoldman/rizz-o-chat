import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { useRevenueCat } from "@/hooks/useRevenueCat";

export function RestorePurchases({ billing }: { billing: Pick<ReturnType<typeof useRevenueCat>, "available" | "busy" | "restore"> }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="mt-5 w-full"
      disabled={!billing.available || billing.busy !== null}
      onClick={async () => {
        const result = await billing.restore();
        if (result.status === "success") toast.success("Purchases restored — your account is updating now.");
        else if (result.status === "error") toast.error(result.message);
      }}
    >
      {billing.busy === "restore" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
      Restore Purchases
    </Button>
  );
}