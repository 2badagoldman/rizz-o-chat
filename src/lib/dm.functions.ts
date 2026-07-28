import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const dmSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { recipientId: string; body: string };
    if (!x?.recipientId) throw new Error("recipientId required");
    const body = (x.body ?? "").trim();
    if (!body) throw new Error("empty message");
    if (body.length > 2000) throw new Error("too long");
    return { recipientId: x.recipientId, body };
  })
  .handler(async ({ data, context }) => {
    const { evaluateChatAccess, CHAT_LOCKED_MESSAGE } = await import("@/lib/chat-access.server");
    const access = await evaluateChatAccess(context.userId);
    if (!access.allowed) throw new Error(CHAT_LOCKED_MESSAGE);

    // Blocking works in both directions (App Store safety requirement).
    const { data: blocked } = await context.supabase.rpc("is_blocked_between", {
      _a: context.userId,
      _b: data.recipientId,
    });
    if (blocked) throw new Error("You can't message this person.");



    const { error, data: row } = await context.supabase

      .from("messages")
      .insert({
        sender_id: context.userId,
        recipient_id: data.recipientId,
        body: data.body,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return row;
  });

export const dmFetchThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { peerId: string; limit?: number };
    if (!x?.peerId) throw new Error("peerId required");
    return { peerId: x.peerId, limit: Math.min(Math.max(x.limit ?? 100, 1), 500) };
  })
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at")
      .is("list_id", null)
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${data.peerId}),and(sender_id.eq.${data.peerId},recipient_id.eq.${me})`,
      )
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

export const dmListThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = context.userId;
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at")
      .is("list_id", null)
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    // Reduce to latest per peer.
    const seen = new Map<string, any>();
    for (const m of rows ?? []) {
      const peerId = m.sender_id === me ? m.recipient_id : m.sender_id;
      if (!peerId || seen.has(peerId)) continue;
      seen.set(peerId, { peerId, lastBody: m.body, lastAt: m.created_at, lastFromMe: m.sender_id === me });
    }
    const peerIds = Array.from(seen.keys());
    if (peerIds.length === 0) return [];

    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, account_type")
      .in("id", peerIds);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return peerIds.map((id) => ({ ...seen.get(id), profile: byId.get(id) ?? null }));
  });
