import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { splitPctFor, friendsToNextTier, nextTierPct, nextTierTarget } from "@/lib/earnings-tiers";

export const getHostSelfStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { days?: number };
    return { days: typeof i.days === "number" && i.days > 0 ? i.days : 30 };
  })
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { supabase, userId } = context;

    const [statsRes, payoutsRes, profileRes] = await Promise.all([
      supabase.rpc("host_self_stats", { _since: since }),
      supabase.from("host_payouts").select("*").eq("host_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("account_type, display_name").eq("id", userId).maybeSingle(),
    ]);
    if (statsRes.error) throw statsRes.error;

    const stats = (statsRes.data ?? {}) as Record<string, number>;
    const activeFriends = Number(stats.active_friends ?? 0);
    const currentSplitPct = Number(stats.split_pct ?? splitPctFor(activeFriends));
    const toNext = friendsToNextTier(activeFriends);

    return {
      days: data.days,
      profile: profileRes.data ?? null,
      stats,
      activeFriends,
      currentSplitPct,
      friendsToFlip: toNext,
      nextSplitPct: nextTierPct(activeFriends),
      nextTierTarget: nextTierTarget(activeFriends),
      flipUnlocked: activeFriends >= 500,
      recentPayouts: payoutsRes.data ?? [],
    };
  });

