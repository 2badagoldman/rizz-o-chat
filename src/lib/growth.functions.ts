import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GrowthMetrics = {
  days: number;
  visitors: number;
  install_prompts: number;
  installs: number;
  standalone_sessions: number;
  signups: number;
  subscriptions: number;
  active_subs: number;
  install_rate: number;
  signup_rate: number;
  subscribe_rate: number;
  install_to_subscribe_rate: number;
  by_platform: Record<string, number>;
  timeseries: Array<{ bucket: string; installs: number; signups: number; subscriptions: number; visitors: number }>;
};

export const getGrowthMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { days?: number };
    const d = typeof i.days === "number" && i.days > 0 && i.days <= 365 ? Math.floor(i.days) : 30;
    return { days: d };
  })
  .handler(async ({ data, context }): Promise<GrowthMetrics> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: metrics, error } = await supabaseAdmin.rpc("install_conversion_metrics", { _days: data.days });
    if (error) throw error;
    return JSON.parse(JSON.stringify(metrics ?? {})) as GrowthMetrics;
  });

export type GrowthBreakdownKind = "installs" | "signups" | "subscriptions" | "active_subs" | "visitors";

export type GrowthBreakdownRow = {
  id: string;
  title: string;
  subtitle: string | null;
  meta: string | null;
  at: string | null;
  user_id: string | null;
};

export const getGrowthBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { kind?: string; days?: number };
    const kinds = ["installs", "signups", "subscriptions", "active_subs", "visitors"] as const;
    const kind = (kinds as readonly string[]).includes(i.kind ?? "")
      ? (i.kind as GrowthBreakdownKind)
      : ("signups" as GrowthBreakdownKind);
    const days = typeof i.days === "number" && i.days > 0 && i.days <= 365 ? Math.floor(i.days) : 30;
    return { kind, days };
  })
  .handler(async ({ data, context }): Promise<{ rows: GrowthBreakdownRow[]; total: number }> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.days * 86400000).toISOString();
    const LIMIT = 300;

    const nameMap = async (ids: string[]) => {
      const unique = [...new Set(ids.filter(Boolean))];
      if (unique.length === 0) return new Map<string, { display_name: string; account_type: string }>();
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, account_type")
        .in("id", unique);
      return new Map((profiles ?? []).map((p) => [p.id, { display_name: p.display_name, account_type: p.account_type as string }]));
    };

    if (data.kind === "signups") {
      const { data: rows, error } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, account_type, created_at, kyc_status, verification_status")
        .gte("created_at", since)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (error) throw error;
      return {
        rows: (rows ?? []).map((r) => ({
          id: r.id,
          title: r.display_name,
          subtitle: `${r.account_type} · KYC ${r.kyc_status}`,
          meta: r.verification_status as string,
          at: r.created_at,
          user_id: r.id,
        })),
        total: rows?.length ?? 0,
      };
    }

    if (data.kind === "subscriptions" || data.kind === "active_subs") {
      let q = supabaseAdmin
        .from("subscriptions")
        .select("id, user_id, price_id, status, current_period_end, environment, created_at")
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      q = data.kind === "subscriptions"
        ? q.gte("created_at", since)
        : q.in("status", ["active", "trialing", "past_due"]);
      const { data: subs, error } = await q;
      if (error) throw error;
      const names = await nameMap((subs ?? []).map((s) => s.user_id));
      return {
        rows: (subs ?? []).map((s) => ({
          id: s.id,
          title: names.get(s.user_id)?.display_name ?? "Unknown member",
          subtitle: `${s.price_id} · ${s.status}`,
          meta: s.current_period_end ? `renews ${new Date(s.current_period_end).toLocaleDateString()}` : s.environment,
          at: s.created_at,
          user_id: s.user_id,
        })),
        total: subs?.length ?? 0,
      };
    }

    // installs + visitors come from analytics_events
    const { data: events, error } = await supabaseAdmin
      .from("analytics_events")
      .select("id, session_id, user_id, event_type, path, device, country, metadata, created_at")
      .gte("created_at", since)
      .eq("event_type", data.kind === "installs" ? "app_install" : "pageview")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;

    const seen = new Set<string>();
    const deduped = (events ?? []).filter((e) => {
      if (seen.has(e.session_id)) return false;
      seen.add(e.session_id);
      return true;
    }).slice(0, LIMIT);

    const names = await nameMap(deduped.map((e) => e.user_id).filter(Boolean) as string[]);
    return {
      rows: deduped.map((e) => ({
        id: String(e.id),
        title: e.user_id ? (names.get(e.user_id)?.display_name ?? "Member") : "Guest visitor",
        subtitle: [(e.metadata as Record<string, unknown> | null)?.platform as string | undefined, e.device, e.country]
          .filter(Boolean)
          .join(" · ") || null,
        meta: e.path ?? null,
        at: e.created_at,
        user_id: e.user_id,
      })),
      total: seen.size,
    };
  });
