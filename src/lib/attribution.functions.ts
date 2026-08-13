import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CreatorCodeStat = {
  code: string;
  label: string | null;
  host_id: string;
  display_name: string | null;
  active: boolean;
  created_at: string;
  visits: number;
  installs: number;
  signups: number;
  subscribers: number;
  friends: number;
};

/** Links the signed-in member to the creator code they arrived from (first touch). */
export const attachAttribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { code?: string; source?: string };
    return {
      code: String(x.code ?? "").trim().toUpperCase().slice(0, 32),
      source: x.source ? String(x.source).slice(0, 40) : undefined,
    };
  })
  .handler(async ({ data, context }) => {
    if (!data.code) return { ok: false as const, error: "invalid_code" };
    const { data: res, error } = await context.supabase.rpc("attach_creator_attribution", {
      _code: data.code,
      _source: data.source ?? undefined,
    });
    if (error) throw error;
    return res as { ok: boolean; error?: string; host_id?: string };
  });

/** Per-code funnel: clicks -> installs -> signups -> subscribers -> friends. */
export const creatorCodeStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { hostId?: string };
    return { hostId: x.hostId ?? undefined };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("creator_code_stats", {
      _host_id: data.hostId ?? undefined,
    });
    if (error) throw error;
    return (rows ?? []) as CreatorCodeStat[];
  });
