import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type PlatformTier = "free" | "plus" | "vip";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/** Crush Gold (plus) and Crush Diamond VIP both count as Gold access. */
export function useGoldAccess() {
  const { user } = useAuth();
  const [tier, setTier] = useState<PlatformTier>("free");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setTier("free");
      setHasSubscription(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const [{ data: profile }, { data: subs }] = await Promise.all([
        supabase.from("profiles").select("platform_tier").eq("id", user.id).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("user_id", user.id)
          .in("status", ACTIVE_STATUSES)
          .limit(5),
      ]);
      if (cancelled) return;
      const live = (subs ?? []).some(
        (s) => !s.current_period_end || new Date(s.current_period_end).getTime() > Date.now(),
      );
      setHasSubscription(live);
      setTier((profile?.platform_tier as PlatformTier) ?? "free");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // An active subscription always grants Gold access, even if the profile
  // tier column hasn't caught up with the latest billing webhook yet.
  return { tier, loading, hasGold: tier === "plus" || tier === "vip" || hasSubscription };
}
