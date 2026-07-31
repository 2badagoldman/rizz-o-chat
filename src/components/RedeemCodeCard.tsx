import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Ticket } from "lucide-react";
import { autoClaimGuestSubscription, claimGuestSubscription } from "@/lib/guest-checkout.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { clearGuestCode } from "@/lib/guest-checkout";

/** Inline redeem widget so any member or host can attach a guest subscription code. */
export function RedeemCodeCard() {
  const claim = useServerFn(claimGuestSubscription);
  const autoClaim = useServerFn(autoClaimGuestSubscription);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<"plus" | "vip" | null>(null);

  const [auto, setAuto] = useState(false);
  const ran = useRef(false);

  // Subscribed as a guest with this email or phone? Attach it silently on load.
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    autoClaim()
      .then((res) => {
        if (res.ok) {
          clearGuestCode();
          setAuto(true);
          setDone(res.tier);
        }
      })
      .catch(() => {});
  }, [autoClaim]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await claim({ data: { code: value, environment: getStripeEnvironment() } });
      if ("error" in res) setErr(res.error);
      else {
        clearGuestCode();
        setDone(res.tier);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not redeem that code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-xl">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Ticket className="h-4 w-4 text-primary" /> Redeem a subscription code
      </p>
      {done ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          {done === "vip" ? "Crush Diamond VIP" : "Crush Gold"} is now active on your account.
          {auto && " We matched your guest purchase automatically."}
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            Paid as a guest? Enter the code from your confirmation (looks like CRUSH-AB12-CD34).
          </p>
          <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CRUSH-XXXX-XXXX"
              aria-label="Subscription code"
              className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm font-black tracking-[0.1em] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={busy}
              className="press-spring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Redeem
            </button>
          </form>
          {err && <p className="mt-2 text-xs font-semibold text-destructive">{err}</p>}
        </>
      )}
    </section>
  );
}
