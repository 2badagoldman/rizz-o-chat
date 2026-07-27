import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createAuthedChatTransport } from "@/lib/authed-chat-transport";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send, Circle, Gift, Sparkles, Heart, Smile } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS, isAiHost } from "@/lib/demo-hosts";
import { hostAvatar } from "@/lib/host-avatars";
import { VirtualMessageList } from "@/components/chat/VirtualMessageList";
import { ChatTrialBanner } from "@/components/chat/ChatTrialBanner";
import { useChatAccess } from "@/hooks/useChatAccess";
import { useFloatingReactions } from "@/components/chat/FloatingReactions";
import { sendChatGift } from "@/lib/subscriptions.functions";
import { toast } from "sonner";


// Jen is a demo id — coin economy only applies to real host UUIDs.
const JEN_UUID = "0dc3f76d-b710-4934-b1e5-4057ccdb082b";


export const Route = createFileRoute("/chat/$hostId")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Chat — Rizzla" }],
  }),
  component: HostChat,
});

const GIFTS: Array<{ emoji: string; label: string; coins: number }> = [
  { emoji: "🌹", label: "Rose", coins: 100 },
  { emoji: "🍫", label: "Chocolate", coins: 250 },
  { emoji: "🧸", label: "Teddy", coins: 500 },
  { emoji: "💎", label: "Diamond", coins: 2500 },
];

// Free reaction emojis — no coins, they just float up and land in the chat.
const REACTIONS = ["❤️", "😍", "🔥", "😘", "😂", "🥰", "💋", "👀", "🙌", "😉", "💕", "✨"];

function HostChat() {
  const { hostId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const { fire, layer } = useFloatingReactions();
  // Per-message reactions (Apple-style): messageId -> emojis.
  const [msgReactions, setMsgReactions] = useState<Record<string, string[]>>({});


  const host = DEMO_HOSTS.find((h) => h.id === hostId);

  const aiHost = isAiHost(hostId);
  const { locked, onTrial, daysLeft } = useChatAccess();
  const isJen = hostId === "demo-jen";

  // WhatsApp-style persistence: every host chat is kept in localStorage,
  // scoped by user (or "anon"), so history stays on the profile across
  // reloads / device sessions. Real user-to-user DMs already persist to
  // the messages table via chat.user.$userId.
  const storageKey = useMemo(
    () => `rizzla:chat:host:${hostId}:${user?.id ?? "anon"}`,
    [hostId, user?.id],
  );
  const initialMessages = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [storageKey]);

  // Welcome-to-Friends-List animation when the user just joined (set by
  // the host profile page in localStorage under `rizzla:welcome:<hostId>`).
  const [welcome, setWelcome] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `rizzla:welcome:${hostId}`;
    if (localStorage.getItem(key) === "1") {
      localStorage.removeItem(key);
      setWelcome(true);
    }
  }, [hostId]);

  // Always auto-dismiss after 2s once shown (safe under StrictMode remounts).
  useEffect(() => {
    if (!welcome) return;
    const t = setTimeout(() => setWelcome(false), 2000);
    return () => clearTimeout(t);
  }, [welcome]);

  // AI hosts stream from the public endpoint (no auth required); everyone else
  // goes through the authenticated host-chat endpoint.
  const transport = useMemo(() => {
    if (aiHost) {
      return new DefaultChatTransport({ api: "/api/public/demo-chat", body: { hostId } });
    }
    return createAuthedChatTransport({ api: "/api/host-chat", body: { hostId } });
  }, [aiHost, hostId]);

  const { messages, setMessages, sendMessage, status } = useChat({
    id: storageKey,
    messages: initialMessages,
    transport,
  });

  const reactionsKey = `${storageKey}:reactions`;

  // Account-level history: signed-in members get their saved thread pulled
  // from the database on mount, so chats survive new sessions and devices.
  const loadThread = useServerFn(loadHostThread);
  const saveThread = useServerFn(saveHostThread);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setHydrated(true); return; }
    setHydrated(false);
    loadThread({ data: { hostId } })
      .then((thread) => {
        if (cancelled) return;
        if (Array.isArray(thread.messages) && thread.messages.length) {
          setMessages(thread.messages as typeof messages);
        }
        if (thread.reactions && Object.keys(thread.reactions).length) {
          setMsgReactions(thread.reactions);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHydrated(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hostId]);

  // Persist on every change once streaming settles, so a full round-trip is
  // saved atomically (mirrors WhatsApp: message stays until you clear chat).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status === "streaming" || status === "submitted") return;
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch {}
    if (!user || !hydrated) return;
    const t = setTimeout(() => {
      saveThread({ data: { hostId, messages, reactions: msgReactions } }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, msgReactions, status, storageKey, hydrated, user?.id, hostId]);

  // Local cache read (instant paint before the account copy arrives).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(reactionsKey);
      const parsed = raw ? JSON.parse(raw) : null;
      setMsgReactions(parsed && typeof parsed === "object" ? parsed : {});
    } catch { setMsgReactions({}); }
  }, [reactionsKey]);


  // Toggle-style: tapping the same emoji again removes it.
  const reactToMessage = (messageId: string, emoji: string, origin: { x: number; y: number }) => {
    fire(emoji, 6, origin);
    setMsgReactions((prev) => {
      const current = prev[messageId] ?? [];
      const next = current.includes(emoji)
        ? current.filter((e) => e !== emoji)
        : [...current, emoji];
      const map = { ...prev, [messageId]: next };
      if (!next.length) delete map[messageId];
      try { localStorage.setItem(reactionsKey, JSON.stringify(map)); } catch {}
      return map;
    });
  };



  // Typing state: shown while the host is composing a reply.
  const typing = (status === "submitted" || status === "streaming") &&
    messages[messages.length - 1]?.role === "user";

  // Seen-state: a member message is "seen" as soon as the host has replied
  // after it; the most recent unanswered one shows delivered/sending.
  const items = useMemo(() => {
    const lastAssistant = messages.map((m) => m.role).lastIndexOf("assistant");
    return messages.map((m, i) => {
      const mine = m.role === "user";
      const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
      const busyNow = status === "submitted" && i === messages.length - 1;
      return {
        id: m.id,
        mine,
        text,
        state: mine
          ? busyNow
            ? ("sending" as const)
            : i < lastAssistant
              ? ("seen" as const)
              : ("sent" as const)
          : undefined,
      };
    });
  }, [messages, status]);



  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;

  if (!host) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Host not found</h1>
        </div>
      </AppShell>
    );
  }

  // Unauthed users can chat AI hosts for free. Everyone else needs to sign in.
  if (!user && !aiHost) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl">Sign in to chat</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  // Signed-in members hitting a non-AI, non-Jen host still need to unlock.
  if (user && !isJen && !aiHost) {
    return (
      <AppShell hideNav>
        <header className="flex items-center gap-3 pt-3 pb-2">
          <button onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })} className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold">{host.name}</h1>
        </header>
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm">
            Unlock {host.name}&apos;s Friends List to start chatting.
          </p>
          <button
            onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })}
            className="btn-brand mt-4 inline-flex"
          >
            Back to profile
          </button>
        </div>
      </AppShell>
    );
  }


  const busy = status === "submitted" || status === "streaming";
  const chatLocked = locked && !aiHost;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || chatLocked) return;
    sendMessage({ text });
    setInput("");
  };

  // Tap a reaction: it bursts up the screen and is delivered to the host as a message.
  const sendReaction = (emoji: string) => {
    fire(emoji);
    if (!busy && !chatLocked) sendMessage({ text: emoji });
  };

  return (

    <AppShell hideNav>
      {welcome ? (
        <div onClick={() => setWelcome(false)} className="fixed inset-0 z-[120] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-br from-primary/90 via-fuchsia-500/80 to-rose-500/90 text-white animate-in fade-in duration-300">
          <div className="relative">
            <img
              src={hostAvatar(host.id)}
              alt={host.name}
              className="h-32 w-32 rounded-full border-4 border-white/70 object-cover shadow-2xl animate-in zoom-in-50 duration-700"
            />
            <Heart className="absolute -right-2 -top-2 h-10 w-10 fill-white text-white drop-shadow animate-bounce" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] opacity-90">You're in</p>
          <h2 className="mt-1 text-3xl font-bold">Welcome to {host.name}'s Friends List</h2>
          <p className="mt-2 text-sm opacity-90">Say hi — she's online now 💌</p>
        </div>
      ) : null}
      <div className="flex min-h-[calc(100vh-1rem)] flex-col">
        <header className="flex items-center gap-3 pt-3 pb-2">
          <button onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })} className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })}
            className="flex items-center gap-2 rounded-full pr-2 text-left transition hover:opacity-80"
            aria-label={`View ${host.name}'s profile`}
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-glow" style={{ background: host.gradient }}>
              <img src={hostAvatar(host.id)} alt={host.name} className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">{host.name}</h1>
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <Circle className="h-2 w-2 fill-emerald-500" /> Online
              </p>
            </div>
          </button>

          {user && isJen ? (
            <button
              onClick={() => setGiftOpen(true)}
              aria-label="Send gift"
              className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:bg-primary/10"
            >
              <Gift className="h-4 w-4 text-primary" />
            </button>
          ) : aiHost && !user ? (
            <Link to="/auth" className="ml-auto rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20">
              Sign up free
            </Link>
          ) : null}
        </header>

        {giftOpen ? (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setGiftOpen(false)}>
            <div className="w-full max-w-[480px] rounded-t-3xl border-t border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Send a gift to</p>
              <h3 className="mt-1 text-lg font-bold">{host.name}</h3>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {GIFTS.map((g) => (
                  <button
                    key={g.label}
                    onClick={async () => {
                      setGiftOpen(false);
                      const res = await sendChatGift({
                        data: { hostId: JEN_UUID, coins: g.coins, label: g.label },
                      });
                      if ("error" in res) {
                        if (res.code === "insufficient_coins") {
                          toast.error("Not enough coins — top up to keep the vibes going.");
                        } else {
                          toast.error(res.error);
                        }
                        return;
                      }
                      toast.success(`${g.label} sent! Balance: ${res.balance}c`);
                      fire(g.emoji, 14);
                      sendMessage({ text: `${g.emoji} sent you a ${g.label} (${g.coins} coins)` });

                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-background px-2 py-3 text-xs hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="font-semibold">{g.label}</span>
                    <span className="text-[10px] text-muted-foreground">{g.coins}c</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Gifts debit your coin balance and credit 65% to the host.
              </p>

            </div>
          </div>
        ) : null}

        <VirtualMessageList
          items={items}
          reactions={msgReactions}
          onReact={reactToMessage}
          typingName={typing ? host.name : null}

          header={
            aiHost && !user ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-[11px] text-primary flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Free preview chat with {host.name}. Sign up to unlock gifts, Rooms & photo/video shares.
              </div>
            ) : null
          }
          empty={
            <div className="mb-3 rounded-2xl border border-border bg-card p-4 text-sm">
              {isJen
                ? "hey! so glad you're actually testing this with me 💌 tell me something about your day"
                : `hey — ${host.teaser.toLowerCase()} what's up with you?`}
            </div>
          }
        />


        {emojiOpen ? (
          <div className="sticky bottom-[76px] z-10 mb-1 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Tap to send {host.name} a reaction
            </p>
            <div className="grid grid-cols-6 gap-1">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => sendReaction(e)}
                  className="rounded-xl py-2 text-2xl transition-transform hover:scale-125 active:scale-95"
                  aria-label={`Send ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => { setInput((v) => v + "❤️"); }}
                className="flex-1 rounded-xl border border-border py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
              >
                Add ❤️ to message
              </button>
              <button
                type="button"
                onClick={() => setEmojiOpen(false)}
                className="rounded-xl border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

        <ChatTrialBanner locked={chatLocked} onTrial={onTrial && !aiHost} daysLeft={daysLeft} />

        <form onSubmit={submit} className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background/95 pb-3 pt-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Emojis"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border transition-colors ${emojiOpen ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:text-primary"}`}
          >
            <Smile className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            disabled={chatLocked}
            placeholder={chatLocked ? "Upgrade to Rizz Gold to keep chatting…" : `Message ${host.name}…`}
            rows={1}
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          {input.trim() ? (
            <button
              type="submit"
              disabled={busy || chatLocked}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendReaction("❤️")}
              className="emoji-pop grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow"
              aria-label="Send love"
            >
              <Heart className="h-5 w-5 fill-white" />
            </button>
          )}
        </form>
        {layer}

      </div>
    </AppShell>
  );
}
