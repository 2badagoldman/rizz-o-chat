import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OnlineDot, useIsOnline } from "@/lib/presence";

import { supabase } from "@/integrations/supabase/client";
import { dmSendMessage, dmFetchThread } from "@/lib/dm.functions";
import { toast } from "sonner";
import { VirtualMessageList } from "@/components/chat/VirtualMessageList";
import { ChatAttachButton, PendingAttachments } from "@/components/chat/ChatMedia";
import { ChatTrialBanner } from "@/components/chat/ChatTrialBanner";
import { useChatAccess } from "@/hooks/useChatAccess";
import { ChatSkinPicker, useChatSkin } from "@/lib/chat-theme";
import { SafetyMenu } from "@/components/SafetyMenu";
import { useFloatingReactions } from "@/components/chat/FloatingReactions";

const DM_REACTIONS = ["❤️", "😍", "🔥", "😘", "😂", "🥰", "💋", "👀", "🙌", "😉", "💕", "✨"];




export const Route = createFileRoute("/chat/user/$userId")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Chat — Crush" }] }),
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
  const [pending, setPending] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const peerOnline = useIsOnline(userId);
  const { locked, onTrial, daysLeft } = useChatAccess();
  const { skin, setSkin, highContrast, setHighContrast, contrastAttr } = useChatSkin(`dm:${userId}`);



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

    // Live: any DM addressed to me (including a host's bulk reply) refreshes
    // the thread the moment it lands. Polling stays as a slow safety net.
    const ch = supabase
      .channel(`dm-${user.id}-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new?.sender_id === userId) load();
        },
      )
      .subscribe();

    const t = setInterval(load, 8000);
    return () => { stop = true; clearInterval(t); supabase.removeChannel(ch); };
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

  const deliver = async (text: string) => {
    if (!text || locked) return;
    const tempId = `pending:${Date.now()}:${Math.random().toString(36).slice(2)}`;
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
      toast.error((err as Error).message);
      throw err;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = [input.trim(), ...pending].filter(Boolean).join("\n");
    if (!text || busy || locked) return;
    setBusy(true);
    setInput("");
    setPending([]);
    try {
      await deliver(text);
    } catch {
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  // Tap an emoji: it bursts toward the member, is delivered as a message, and
  // is appended to the draft so it can be reused in a sentence.
  const tapEmoji = (emoji: string) => {
    fire(emoji);
    setInput((v) => v + emoji);
    void deliver(emoji).catch(() => {});
  };


  return (
    <AppShell hideNav>
      <div data-chat-skin={skin} data-chat-contrast={contrastAttr} className="chat-wallpaper -mb-24 flex h-[calc(100dvh-9rem)] min-h-[420px] flex-col overflow-hidden">
        <header className="flex items-center gap-3 pt-3 pb-2">

          <button onClick={() => navigate({ to: "/chats" })} className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/u/$userId", params: { userId } })}
            className="flex items-center gap-2 min-w-0 rounded-full pr-2 text-left transition hover:opacity-80"
            aria-label="View profile"
          >
            <div className="relative">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
                {peer?.avatar_url ? (
                  <img src={peer.avatar_url} alt={peer.display_name ?? "User"} className="h-full w-full object-cover" />
                ) : (
                  (peer?.display_name ?? "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <OnlineDot online={peerOnline} className="absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight">{peer?.display_name ?? "User"}</h1>
              <p className="truncate text-[11px] text-muted-foreground">
                {peerOnline ? <span className="text-emerald-500 font-medium">Online now</span> : "Direct message"}
              </p>
            </div>
          </button>
          <ChatSkinPicker skin={skin} onChange={setSkin} highContrast={highContrast} onHighContrastChange={setHighContrast} className="ml-auto" />
          <SafetyMenu userId={userId} name={peer?.display_name ?? "this member"} context="direct message" />

        </header>


        <VirtualMessageList
          items={items}
          empty={
            <div className="mb-3 rounded-2xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Say hi to start the conversation.
            </div>
          }
        />

        <ChatTrialBanner locked={locked} onTrial={onTrial} daysLeft={daysLeft} />

        {emojiOpen ? (
          <div className="mb-1 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Tap to send {peer?.display_name ?? "them"} a reaction — it&apos;s added to your draft too
            </p>
            <div className="grid grid-cols-6 gap-1">
              {DM_REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => tapEmoji(e)}
                  disabled={locked}
                  className="rounded-xl py-2 text-2xl transition-transform hover:scale-125 active:scale-95 disabled:opacity-50"
                  aria-label={`Send ${e} and add it to your message`}
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEmojiOpen(false)}
              className="mt-2 w-full rounded-xl border border-border py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              Close
            </button>
          </div>
        ) : null}

        <form onSubmit={submit} className="sticky bottom-0 border-t border-border bg-background/95 pb-3 pt-3 backdrop-blur">
          <PendingAttachments markers={pending} onRemove={(m) => setPending((p) => p.filter((x) => x !== m))} />
          <div className="flex items-end gap-2">
          <ChatAttachButton disabled={locked} onUploaded={(m) => setPending((p) => [...p, m])} />
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Emoji reactions"
            aria-expanded={emojiOpen}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border transition-colors ${emojiOpen ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:text-primary"}`}
          >
            <Smile className="h-5 w-5" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
            disabled={locked}
            placeholder={locked ? "Upgrade to Crush Gold to keep chatting…" : `Message ${peer?.display_name ?? "user"}…`}
            rows={1}
            className="chat-type min-h-[48px] max-h-32 flex-1 resize-none rounded-[22px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || locked || (!input.trim() && !pending.length)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
