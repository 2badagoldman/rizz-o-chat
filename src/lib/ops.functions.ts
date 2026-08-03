import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ManagerId, ManagerResult } from "@/lib/ops.server";

export type OpsRun = {
  id: string;
  manager: string;
  status: string;
  summary: string | null;
  items: number;
  duration_ms: number;
  details: Record<string, string | number | boolean | null>;
  trigger: string;
  created_at: string;
};

/** Control-room snapshot: latest outcome per manager + recent run history. */
export const getOpsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ latest: Record<string, OpsRun>; history: OpsRun[] }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const { data, error } = await context.supabase
      .from("ops_runs")
      .select("id, manager, status, summary, items, duration_ms, details, trigger, created_at")
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw error;

    const history = (data ?? []) as unknown as OpsRun[];
    const latest: Record<string, OpsRun> = {};
    for (const row of history) if (!latest[row.manager]) latest[row.manager] = row;

    return { latest, history: history.slice(0, 40) };
  });

/** Run one manager (or all of them) on demand from the control room. */
export const runOpsManagers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { manager?: string };
    return { manager: (i.manager ?? "all").toString() };
  })
  .handler(async ({ data, context }): Promise<ManagerResult[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { MANAGERS, runManagers } = await import("@/lib/ops.server");

    const ids: ManagerId[] =
      data.manager === "all"
        ? MANAGERS.map((m) => m.id)
        : (MANAGERS.filter((m) => m.id === data.manager).map((m) => m.id) as ManagerId[]);
    if (ids.length === 0) throw new Error("Unknown manager");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return runManagers(supabaseAdmin as any, ids, "manual");
  });
