import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InboxThread = {
  peerId: string;
  name: string;
  avatar: string | null;
  lastBody: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
};

/** Every DM thread for the signed-in host/member, with unread counts. */
export const inboxThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InboxThread[]> => {
    const me = context.userId;

    const [{ data: rows, error }, { data: reads }] = await Promise.all([
      context.supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, created_at")
        .is("list_id", null)
        .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
        .order("created_at", { ascending: false })
        .limit(2000),
      context.supabase.from("message_reads").select("peer_id, last_read_at").eq("user_id", me),
    ]);
    if (error) throw error;

    const readAt = new Map<string, number>(
      (reads ?? []).map((r: any) => [r.peer_id, Date.parse(r.last_read_at)]),
    );

    const threads = new Map<string, InboxThread>();
    for (const m of rows ?? []) {
      const peerId = m.sender_id === me ? m.recipient_id : m.sender_id;
      if (!peerId) continue;
      const mine = m.sender_id === me;
      let t = threads.get(peerId);
      if (!t) {
        t = {
          peerId,
          name: "Member",
          avatar: null,
          lastBody: m.body,
          lastAt: m.created_at,
          lastFromMe: mine,
          unread: 0,
        };
        threads.set(peerId, t);
      }
      if (!mine && Date.parse(m.created_at) > (readAt.get(peerId) ?? 0)) t.unread += 1;
    }

    const ids = Array.from(threads.keys());
    if (!ids.length) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ids);
    for (const p of profiles ?? []) {
      const t = threads.get(p.id);
      if (t) {
        t.name = p.display_name ?? "Member";
        t.avatar = p.avatar_url ?? null;
      }
    }
    return Array.from(threads.values()).sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt));
  });

/** Bulk "mark as read" for one, many, or every conversation. */
export const markThreadsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { peerIds?: string[] };
    const peerIds = (x?.peerIds ?? []).filter(Boolean).slice(0, 1000);
    if (!peerIds.length) throw new Error("Pick at least one conversation");
    return { peerIds };
  })
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error } = await context.supabase.from("message_reads").upsert(
      data.peerIds.map((peer_id) => ({
        user_id: context.userId,
        peer_id,
        last_read_at: now,
        updated_at: now,
      })),
      { onConflict: "user_id,peer_id" },
    );
    if (error) throw error;
    return { marked: data.peerIds.length };
  });

/** Send the same reply to many conversations at once (high-volume days). */
export const bulkReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { peerIds?: string[]; body?: string };
    const peerIds = (x?.peerIds ?? []).filter(Boolean).slice(0, 500);
    const body = (x?.body ?? "").trim();
    if (!peerIds.length) throw new Error("Pick at least one conversation");
    if (!body) throw new Error("Write a message first");
    if (body.length > 2000) throw new Error("Message too long");
    return { peerIds, body };
  })
  .handler(async ({ data, context }) => {
    const { evaluateChatAccess, CHAT_LOCKED_MESSAGE } = await import("@/lib/chat-access.server");
    const access = await evaluateChatAccess(context.userId);
    if (!access.allowed) throw new Error(CHAT_LOCKED_MESSAGE);

    // Never message anyone involved in a block, in either direction.
    const { data: blocks } = await context.supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${context.userId},blocked_id.eq.${context.userId}`);
    const blocked = new Set(
      (blocks ?? []).flatMap((b: any) => [b.blocker_id, b.blocked_id]).filter((id) => id !== context.userId),
    );

    const targets = data.peerIds.filter((id) => !blocked.has(id));
    if (!targets.length) return { sent: 0, skipped: data.peerIds.length };

    const { error } = await context.supabase.from("messages").insert(
      targets.map((recipient_id) => ({
        sender_id: context.userId,
        recipient_id,
        body: data.body,
      })),
    );
    if (error) throw error;

    const now = new Date().toISOString();
    await context.supabase.from("message_reads").upsert(
      targets.map((peer_id) => ({ user_id: context.userId, peer_id, last_read_at: now, updated_at: now })),
      { onConflict: "user_id,peer_id" },
    );

    return { sent: targets.length, skipped: data.peerIds.length - targets.length };
  });
