import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { days?: number };
    return { days: typeof i.days === "number" && i.days > 0 ? i.days : 30 };
  })
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const [{ data: metrics, error: e1 }, { data: topHosts, error: e2 }, { data: payouts, error: e3 }] = await Promise.all([
      supabase.rpc("admin_platform_metrics", { _since: since }),
      supabase.rpc("admin_top_hosts", { _since: since, _limit: 15 }),
      supabase
        .from("host_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;

    return {
      days: data.days,
      metrics: JSON.parse(JSON.stringify(metrics ?? {})) as Record<string, number | string | null>,
      topHosts: topHosts ?? [],
      recentPayouts: payouts ?? [],
    };
  });

export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { targetUserId?: string; secret?: string };
    if (!i.targetUserId) throw new Error("targetUserId required");
    return { targetUserId: i.targetUserId, secret: i.secret ?? "" };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    // Bootstrap allowance: if no admin exists yet, allow the caller to promote themselves.
    if (!isAdmin) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) > 0) throw new Error("Forbidden");
      if (data.targetUserId !== userId) throw new Error("Bootstrap can only self-promote");
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
      return { ok: true, bootstrap: true };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.targetUserId, role: "admin" });
    if (error) throw error;
    return { ok: true };
  });
