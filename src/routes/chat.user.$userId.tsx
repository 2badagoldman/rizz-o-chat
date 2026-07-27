import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OnlineDot, useIsOnline } from "@/lib/presence";

import { supabase } from "@/integrations/supabase/client";
import { dmSendMessage, dmFetchThread } from "@/lib/dm.functions";
import { toast } from "sonner";
import { VirtualMessageList } from "@/components/chat/VirtualMessageList";

export const Route = createFileRoute("/chat/user/$userId")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Chat — Rizzla" }] }),
  component: UserChat,
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };

function UserChat() {
  const { userId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(dmSendMessage);
  const fetchThread = useServerFn(dmFetchThread);
  const [peer, setPeer] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle()
      .then(({ data }) => setPeer(data));
  }, [user, userId]);

  useEffect(() => {
    if (!user) return;
    let stop = false;
    const load = () =>
      fetchThread({ data: { peerId: userId } }).then((rows) => {
        if (stop) return;
        // Keep in-flight optimistic bubbles on top of the server snapshot.
        setMessages((prev) => [...(rows as Msg[]), ...prev.filter((m) => m.id.startsWith("pending:"))]);
      }).catch(() => {});
    load();
    const t = setInterval(load, 3000);
    return () => { stop = true; clearInterval(t); };
  }, [user, userId, fetchThread]);

  // Seen-state: my message counts as seen once the peer has sent anything
  // after it; otherwise it is delivered (or sending while in flight).
  const items = useMemo(() => {
    const lastPeerAt = messages.reduce<number>(
      (acc, m) => (m.sender_id !== user?.id ? Math.max(acc, Date.parse(m.created_at)) : acc),
      0,
    );
    return messages.map((m) => {
      const mine = m.sender_id === user?.id;
      const at = Date.parse(m.created_at);
      return {
        id: m.id,
        mine,
        text: m.body,
        time: new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        state: mine
          ? m.id.startsWith("pending:")
            ? ("sending" as const)
            : at <= lastPeerAt
              ? ("seen" as const)
              : ("sent" as const)
          : undefined,
      };
    });
  }, [messages, user?.id]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Sign in to chat</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }
  if (user.id === userId) {
    return (
      <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">That&apos;s you.</p></AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    const tempId = `pending:${Date.now()}`;
    setInput("");
    // Optimistic bubble so mobile feels instant; swapped for the real row.
    setMessages((m) => [
      ...m,
      { id: tempId, sender_id: user.id, recipient_id: userId, body: text, created_at: new Date().toISOString() },
    ]);
    try {
      const row = await send({ data: { recipientId: userId, body: text } });
      setMessages((m) =>
        m.map((x) =>
          x.id === tempId
            ? { id: row.id, sender_id: user.id, recipient_id: userId, body: text, created_at: row.created_at }
            : x,
        ),
      );
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setInput(text);
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell hideNav>
      <div className="flex min-h-[calc(100vh-1rem)] flex-col">
        <header className="flex items-center gap-3 pt-3 pb-2">
          <button onClick={() => navigate({ to: "/chats" })} className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-10 w-10 rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
              {(peer?.display_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight">{peer?.display_name ?? "User"}</h1>
              <p className="truncate text-[11px] text-muted-foreground">Direct message</p>
            </div>
          </div>
        </header>

        <VirtualMessageList
          items={items}
          empty={
            <div className="mb-3 rounded-2xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Say hi to start the conversation.
            </div>
          }
        />

        <form onSubmit={submit} className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background/95 pb-3 pt-3 backdrop-blur">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
            placeholder={`Message ${peer?.display_name ?? "user"}…`}
            rows={1}
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
