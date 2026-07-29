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
