import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, Loader2, Sparkles, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getStripeEnvironment } from "@/lib/stripe";
import { readGuestCode } from "@/lib/guest-checkout";

type Tier = "free" | "plus" | "vip";

interface SubRow {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  plus: "Crush Gold",
  vip: "Crush Diamond VIP",
};

function fmt(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Shows the member's current tier plus whether a guest subscription code was matched. */
export function SubscriptionStatusCard() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("free");
  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestCode, setGuestCode] = useState<string | null>(null);

  useEffect(() => {
    setGuestCode(readGuestCode());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let environment: "sandbox" | "live" | null = null;
      try {
        environment = getStripeEnvironment();
      } catch {
        environment = null;
      }
      const profileReq = supabase.from("profiles").select("platform_tier").eq("id", user.id).maybeSingle();
      const subReq = environment
        ? supabase
            .from("subscriptions")
            .select("status, price_id, current_period_end, cancel_at_period_end")
            .eq("user_id", user.id)
            .eq("environment", environment)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null } as { data: SubRow | null });

      const [{ data: profile }, { data: subRow }] = await Promise.all([profileReq, subReq]);
      if (cancelled) return;
      setTier(((profile?.platform_tier as Tier) ?? "free"));
      setSub((subRow as SubRow | null) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  const active = !!sub && ["active", "trialing", "past_due"].includes(sub.status);
  const matched = active || tier !== "free";
  const renews = fmt(sub?.current_period_end ?? null);

  return (
    <section className="mt-6 rounded-[1.25rem] border border-border/70 bg-card/70 p-4 shadow-card backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tier === "vip" ? (
            <Crown className="h-4 w-4 text-primary" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          <h2 className="text-sm font-black tracking-tight">Subscription status</h2>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span
            className={
              "rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide " +
              (tier === "free"
                ? "border border-border/70 bg-background/60 text-muted-foreground"
                : "bg-primary/15 text-primary")
            }
          >
            {TIER_LABEL[tier]}
          </span>
        )}
      </div>

      {!loading && (
        <div className="mt-3 space-y-1.5 text-xs font-semibold text-muted-foreground">
          <p>
            Plan status:{" "}
            <span className={active ? "text-primary" : "text-foreground"}>
              {active ? sub!.status.replace("_", " ") : tier === "free" ? "no active plan" : "active"}
            </span>
          </p>
          {renews && (
            <p>
              {sub?.cancel_at_period_end ? "Access ends" : "Renews"} {renews}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            Guest subscription:{" "}
            <span className={matched ? "text-primary" : "text-foreground"}>
              {matched
                ? "matched to this account"
                : guestCode
                  ? `code ${guestCode} not matched yet`
                  : "none linked"}
            </span>
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!matched && (
          <Link
            to="/claim"
            className="press-spring rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground"
          >
            {guestCode ? "Match my code" : "Redeem a code"}
          </Link>
        )}
        <Link
          to="/upgrade"
          className="press-spring rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-black"
        >
          {tier === "free" ? "See plans" : "Change plan"}
        </Link>
        <Link
          to="/subscriptions"
          className="press-spring rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-black"
        >
          Billing
        </Link>
      </div>
    </section>
  );
}
