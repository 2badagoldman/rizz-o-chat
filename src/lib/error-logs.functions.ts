import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ErrorLogRow = {
  id: string;
  created_at: string;
  source: string;
  level: string;
  message: string;
  stack: string | null;
  route: string | null;
  url: string | null;
  method: string | null;
  status: number | null;
  duration_ms: number | null;
  fingerprint: string | null;
  user_id: string | null;
  session_id: string | null;
  user_agent: string | null;
  release: string | null;
  context: Record<string, string | number | boolean | null> | null;
};

export type ErrorGroup = {
  fingerprint: string;
  message: string;
  source: string;
  count: number;
  lastSeen: string;
  routes: string[];
  latest: ErrorLogRow;
};

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isAdmin } = await (context.supabase.rpc as (n: string, a: unknown) => Promise<{ data: boolean | null }>)(
    "has_role",
    { _user_id: context.userId, _role: "admin" },
  );
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

/** Recent errors, plus the same errors grouped by fingerprint for triage. */
export const listErrorLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { source?: string; limit?: number };
    return {
      source: i.source === "client" || i.source === "server" ? i.source : "all",
      limit: Math.min(Math.max(Number(i.limit ?? 200), 1), 500),
    };
  })
  .handler(async ({ data, context }): Promise<{ rows: ErrorLogRow[]; groups: ErrorGroup[] }> => {
    await assertAdmin(context);

    let query = context.supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.source !== "all") query = query.eq("source", data.source);

    const { data: rows, error } = await query;
    if (error) throw error;

    const list = (rows ?? []) as unknown as ErrorLogRow[];
    const byPrint = new Map<string, ErrorGroup>();
    for (const row of list) {
      const key = row.fingerprint ?? row.message;
      const existing = byPrint.get(key);
      if (existing) {
        existing.count += 1;
        if (row.route && !existing.routes.includes(row.route)) existing.routes.push(row.route);
      } else {
        byPrint.set(key, {
          fingerprint: key,
          message: row.message,
          source: row.source,
          count: 1,
          lastSeen: row.created_at,
          routes: row.route ? [row.route] : [],
          latest: row,
        });
      }
    }

    return {
      rows: list,
      groups: [...byPrint.values()].sort((a, b) => b.count - a.count),
    };
  });

/** Clear resolved noise: one group, or everything older than N days. */
export const clearErrorLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { fingerprint?: string; olderThanDays?: number };
    return {
      fingerprint: i.fingerprint ? String(i.fingerprint) : null,
      olderThanDays: i.olderThanDays ? Math.min(Math.max(Number(i.olderThanDays), 1), 365) : null,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);

    if (data.fingerprint) {
      const { error } = await context.supabase
        .from("error_logs")
        .delete()
        .eq("fingerprint", data.fingerprint);
      if (error) throw error;
    } else {
      const cutoff = new Date(
        Date.now() - (data.olderThanDays ?? 7) * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { error } = await context.supabase.from("error_logs").delete().lt("created_at", cutoff);
      if (error) throw error;
    }
    return { ok: true };
  });
