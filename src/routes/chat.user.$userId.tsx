import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { dmSendMessage, dmFetchThread } from "@/lib/dm.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/user/$userId")({
  head: () => ({ meta: [{ title: "Chat — Rizzla" }] }),
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
        if (!stop) setMessages(rows as Msg[]);
      }).catch(() => {});
    load();
    const t = setInterval(load, 3000);
    return () => { stop = true; clearInterval(t); };
  }, [user, userId, fetchThread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
    try {
      const row = await send({ data: { recipientId: userId, body: text } });
      setInput("");
      setMessages((m) => [...m, { id: row.id, sender_id: user.id, recipient_id: userId, body: text, created_at: row.created_at }]);
    } catch (err) {
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Say hi to start the conversation.
            </div>
          ) : messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={
                  mine
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2 text-sm text-white shadow-glow"
                    : "max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2 text-sm"
                }>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              </div>
            );
          })}
        </div>

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
