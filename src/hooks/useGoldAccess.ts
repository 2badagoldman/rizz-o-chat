import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type PlatformTier = "free" | "plus" | "vip";

/** Rizz Gold (plus) and Rizz Diamond VIP both count as Gold access. */
export function useGoldAccess() {
  const { user } = useAuth();
  const [tier, setTier] = useState<PlatformTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setTier("free");
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("platform_tier")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setTier(((data?.platform_tier as PlatformTier) ?? "free"));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { tier, loading, hasGold: tier === "plus" || tier === "vip" };
}
