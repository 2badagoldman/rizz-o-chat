import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HostThread = {
  messages: unknown[];
  reactions: Record<string, string[]>;
};

const MAX_MESSAGES = 400;

/** Load the signed-in member's saved thread with a host (empty when none yet). */
export const loadHostThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { hostId?: string };
    return { hostId: String(x.hostId ?? "").slice(0, 120) };
  })
  .handler(async ({ data, context }): Promise<HostThread> => {
    if (!data.hostId) return { messages: [], reactions: {} };
    const { data: row } = await context.supabase
      .from("host_chat_threads")
      .select("messages, reactions")
      .eq("user_id", context.userId)
      .eq("host_id", data.hostId)
      .maybeSingle();
    return {
      messages: Array.isArray(row?.messages) ? (row!.messages as unknown[]) : [],
      reactions:
        row?.reactions && typeof row.reactions === "object"
          ? (row.reactions as Record<string, string[]>)
          : {},
    };
  });

/** Persist the thread to the member's account so it survives new sessions/devices. */
export const saveHostThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as {
      hostId?: string;
      messages?: unknown;
      reactions?: unknown;
    };
    const messages = Array.isArray(x.messages) ? x.messages.slice(-MAX_MESSAGES) : [];
    const reactions =
      x.reactions && typeof x.reactions === "object" && !Array.isArray(x.reactions)
        ? (x.reactions as Record<string, string[]>)
        : {};
    return { hostId: String(x.hostId ?? "").slice(0, 120), messages, reactions };
  })
  .handler(async ({ data, context }) => {
    if (!data.hostId) return { ok: false as const };
    const { error } = await context.supabase.from("host_chat_threads").upsert(
      {
        user_id: context.userId,
        host_id: data.hostId,
        messages: data.messages,
        reactions: data.reactions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,host_id" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
