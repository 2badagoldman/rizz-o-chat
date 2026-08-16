import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { useServerFn } from "@tanstack/react-start";
import { loadHostThread, saveHostThread } from "@/lib/host-chat-history.functions";
import { DefaultChatTransport } from "ai";
import { createAuthedChatTransport } from "@/lib/authed-chat-transport";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send, Circle, Gift, Sparkles, Heart, Smile } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { readTasteTranscript, clearTasteTranscript } from "@/lib/taste-chat";
import { readMemberMemory, confirmedMemberName, rememberFromMessage, memberNotes as readMemberNotes } from "@/lib/member-memory";
import { DEMO_HOSTS, isAiHost } from "@/lib/demo-hosts";
import { hostAvatar } from "@/lib/host-avatars";
import { pickOpener } from "@/lib/host-personas";
import { VirtualMessageList } from "@/components/chat/VirtualMessageList";
import { ChatAttachButton, PendingAttachments } from "@/components/chat/ChatMedia";
import { CreatorVoiceButton, VoiceRecordButton } from "@/components/chat/VoiceNote";
import { ChatTrialBanner } from "@/components/chat/ChatTrialBanner";
import { useChatAccess } from "@/hooks/useChatAccess";
import { useFloatingReactions } from "@/components/chat/FloatingReactions";
import { sendChatGift } from "@/lib/subscriptions.functions";
import { toast } from "sonner";
import { ChatSkinPicker, useChatSkin } from "@/lib/chat-theme";
import { SafetyMenu } from "@/components/SafetyMenu";
import { useAiQuota } from "@/hooks/useAiQuota";
import { AiQuotaPrompt } from "@/components/chat/AiQuotaPrompt";
import { EmojiTray, useEmojiMode } from "@/components/chat/EmojiTray";
import { SignedOutGate } from "@/components/SignedOutGate";





// Jen is a demo id — coin economy only applies to real creator UUIDs.
const JEN_UUID = "0dc3f76d-b710-4934-b1e5-4057ccdb082b";


export const Route = createFileRoute("/chat/$hostId")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Chat — Crush" }],
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
const REACTIONS = ["❤️", "😍", "🔥", "😂", "🥰", "🎉", "👀", "🙌", "😉", "💕", "☕", "✨"];

function HostChat() {
  const { hostId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  // When the member sends a voice note, her reply comes back as a voice note too.
  const [autoVoice, setAutoVoice] = useState(false);
  const { skin, setSkin, highContrast, setHighContrast, contrastAttr } = useChatSkin(`creator:${hostId}`);

  const [emojiOpen, setEmojiOpen] = useState(false);
  // "send" delivers the emoji as a message; "react" only bursts + tags the latest message.
  const { mode: emojiMode, setMode: setEmojiMode } = useEmojiMode(`creator:${hostId}`);

  const { fire, layer } = useFloatingReactions();
  // Per-message reactions (Apple-style): messageId -> emojis.
  const [msgReactions, setMsgReactions] = useState<Record<string, string[]>>({});


  const creator = DEMO_HOSTS.find((h) => h.id === hostId);

  const aiHost = isAiHost(hostId);
  const { locked, onTrial, daysLeft } = useChatAccess();
  const isJen = hostId === "demo-jen";

  // WhatsApp-style persistence: every creator chat is kept in localStorage,
  // scoped by user (or "anon"), so history stays on the profile across
  // reloads / device sessions. Real user-to-user DMs already persist to
  // the messages table via chat.user.$userId.
  const storageKey = useMemo(
    () => `rizzla:chat:creator:${hostId}:${user?.id ?? "anon"}`,
    [hostId, user?.id],
  );
  const initialMessages = useMemo(() => {
    if (typeof window === "undefined") return [];
    let local: any[] = [];
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      local = Array.isArray(parsed) ? parsed : [];
    } catch { local = []; }
    // Carry over the conversation they started on the landing page so the chat
    // they already tasted is right here, ready to continue.
    if (!local.length) {
      const taste = readTasteTranscript();
      if (taste && taste.hostId === hostId) {
        clearTasteTranscript();
        try { localStorage.setItem(storageKey, JSON.stringify(taste.messages)); } catch { /* ignore */ }
        return taste.messages as any[];
      }
    }
    return local;
  }, [storageKey, hostId]);

  // Welcome-to-Friends-List animation when the user just joined (set by
  // the creator profile page in localStorage under `rizzla:welcome:<hostId>`).
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

  // AI creators stream from the public endpoint (no auth required); everyone else
  // goes through the authenticated host-chat endpoint.
  // She should know his name and what he's already told her — that's the whole
  // difference between "a chat" and feeling seen.
  const [memory, setMemory] = useState({ name: "", notes: "" });
  useEffect(() => {
    setMemory({ name: confirmedMemberName(), notes: readMemberNotes() });
  }, [hostId]);

  const transport = useMemo(() => {
    const body = { hostId, memberName: memory.name, memberNotes: memory.notes };
    if (aiHost) {
      return new DefaultChatTransport({ api: "/api/public/demo-chat", body });
    }
    return createAuthedChatTransport({ api: "/api/host-chat", body });
  }, [aiHost, hostId, memory.name, memory.notes]);

  /** Learn from what he just typed before it goes out, so she can use it. */
  const remember = (text: string) => {
    rememberFromMessage(text);
    const m = readMemberMemory();
    setMemory({ name: m.nameConfirmed ? m.name : "", notes: readMemberNotes() });
  };

  const { messages, setMessages, sendMessage, status } = useChat({
    id: storageKey,
    messages: initialMessages,
    transport,
  });

  // Free AI replies: 10 per AI creator, then Crush Gold is required.
  const aiQuota = useAiQuota(`creator:${hostId}`);
  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  useEffect(() => {
    if (aiHost) aiQuota.track(assistantCount);
  }, [aiHost, assistantCount, aiQuota.track]);
  const aiQuotaReached = aiHost && aiQuota.reached;

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

  // React-only mode: burst the emoji and tag the newest message, send nothing.
  const reactToLatest = (emoji: string) => {
    const last = messages[messages.length - 1];
    if (!last) { fire(emoji); return; }
    reactToMessage(last.id, emoji, { x: window.innerWidth / 2, y: window.innerHeight * 0.7 });
  };



  // Typing state: shown while the creator is composing a reply.
  const typing = (status === "submitted" || status === "streaming") &&
    messages[messages.length - 1]?.role === "user";

  // Seen-state: a member message is "seen" as soon as the creator has replied
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

  if (!creator) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Creator not found</h1>
        </div>
      </AppShell>
    );
  }

  // Unauthed users can chat AI creators for free. Everyone else needs to sign in.
  if (!user && !aiHost) {
    return (
      <SignedOutGate
        title="Sign in to chat"
        description="Sign in to message this creator — or head to Chats and talk with our AI creators free."
      />
    );
  }

  // Signed-in members hitting a non-AI, non-Jen creator still need to unlock.
  if (user && !isJen && !aiHost) {
    return (
      <AppShell hideNav>
        <header className="flex items-center gap-3 pt-3 pb-2">
          <button type="button" aria-label={`Back to ${creator.name}'s profile`} onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })} className="grid h-11 w-11 place-items-center rounded-full border border-border">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold">{creator.name}</h1>
        </header>
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm">
            Unlock {creator.name}&apos;s Friends List to start chatting.
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
  const chatLocked = (locked && !aiHost) || aiQuotaReached;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [input.trim(), ...pending].filter(Boolean).join("\n");
    if (!text || busy || chatLocked) return;
    setAutoVoice(false);
    remember(text);
    sendMessage({ text });
    setInput("");
    setPending([]);
  };

  // Voice note: uploaded (when signed in) + transcribed so she can reply to
  // what was actually said, then her answer plays back in her own voice.
  const sendVoiceNote = ({ marker, transcript }: { marker: string | null; transcript: string }) => {
    if (busy || chatLocked) return;
    const text = [transcript.trim(), marker].filter(Boolean).join("\n");
    if (!text) return;
    setAutoVoice(true);
    remember(text);
    sendMessage({ text });
  };

  // Tap a reaction: it bursts up the screen, is delivered to the creator as a
  // message, and is also appended to the draft so it can be reused in context.
  const sendReaction = (emoji: string, opts?: { draft?: boolean }) => {
    fire(emoji);
    if (!busy && !chatLocked) sendMessage({ text: emoji });
    if (opts?.draft) setInput((v) => v + emoji);
  };


  return (

    <AppShell hideNav>
      {welcome ? (
        <div onClick={() => setWelcome(false)} className="fixed inset-0 z-[120] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-br from-primary/90 via-fuchsia-500/80 to-rose-500/90 text-white animate-in fade-in duration-300">
          <div className="relative">
            <img loading="lazy" decoding="async"
              src={hostAvatar(creator.id)}
              alt={creator.name}
              className="h-32 w-32 rounded-full border-4 border-white/70 object-cover shadow-2xl animate-in zoom-in-50 duration-700"
            />
            <Heart className="absolute -right-2 -top-2 h-10 w-10 fill-white text-white drop-shadow animate-bounce" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] opacity-90">You're in</p>
          <h2 className="mt-1 text-3xl font-bold">Welcome to {creator.name}'s Friends List</h2>
          <p className="mt-2 text-sm opacity-90">Say hi — she's online now 💌</p>
        </div>
      ) : null}
      <div data-chat-skin={skin} data-chat-contrast={contrastAttr} className="chat-wallpaper -mb-24 flex h-[calc(100dvh-9rem)] min-h-[420px] flex-col overflow-hidden">
        <header className="flex items-center gap-3 pt-3 pb-2">
          <button type="button" aria-label={`Back to ${creator.name}'s profile`} onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })} className="grid h-11 w-11 place-items-center rounded-full border border-border">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })}
            className="flex items-center gap-2 rounded-full pr-2 text-left transition hover:opacity-80"
            aria-label={`View ${creator.name}'s profile`}
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-glow" style={{ background: creator.gradient }}>
              <img loading="lazy" decoding="async" src={hostAvatar(creator.id)} alt={creator.name} className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">{creator.name}</h1>
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <Circle className="h-2 w-2 fill-emerald-500" /> Online
              </p>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ChatSkinPicker skin={skin} onChange={setSkin} highContrast={highContrast} onHighContrastChange={setHighContrast} />
            <SafetyMenu userId={null} name={creator.name} context="creator chat" />

            {user && isJen ? (
              <button
                onClick={() => setGiftOpen(true)}
                aria-label="Send gift"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:bg-primary/10"
              >
                <Gift className="h-4 w-4 text-primary" />
              </button>
            ) : aiHost && !user ? (
              <Link to="/auth" className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20">
                Sign up free
              </Link>
            ) : null}
          </div>
        </header>


        {giftOpen ? (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setGiftOpen(false)}>
            <div className="w-full max-w-[480px] rounded-t-3xl border-t border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Send a gift to</p>
              <h3 className="mt-1 text-lg font-bold">{creator.name}</h3>
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
                Gifts debit your coin balance and credit the creator at their current split (35–65%).
              </p>

            </div>
          </div>
        ) : null}

        <VirtualMessageList
          items={items}
          reactions={msgReactions}
          onReact={reactToMessage}
          typingName={typing ? creator.name : null}
          renderVoice={(item, isLatest) =>
            item.mine || !item.text.trim() ? null : (
              <CreatorVoiceButton
                text={item.text}
                hostId={hostId}
                autoPlay={autoVoice && isLatest && !busy}
              />
            )
          }

          header={
            aiHost && !user ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-[11px] text-primary flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Free preview chat with {creator.name}. Sign up to unlock gifts, Rooms & photo/video shares.
              </div>
            ) : null
          }
          empty={
            <div className="mb-3 rounded-2xl border border-border bg-card p-4 text-sm">
              {pickOpener(
                hostId,
                user?.id ?? "guest",
                `hey — ${creator.teaser.toLowerCase()} what's up with you?`,
              )}
            </div>
          }
        />


        <EmojiTray
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          mode={emojiMode}
          onModeChange={setEmojiMode}
          onPick={(e, m) =>
            m === "send" ? sendReaction(e, { draft: true }) : reactToLatest(e)
          }
          peerName={creator.name}
          disabled={chatLocked}
          emojis={REACTIONS}
        />



        {aiQuotaReached ? (
          <div className="px-3 pb-2">
            <AiQuotaPrompt limit={aiQuota.limit} who={creator.name} />
          </div>
        ) : (
          <ChatTrialBanner locked={chatLocked} onTrial={onTrial && !aiHost} daysLeft={daysLeft} />
        )}

        <form onSubmit={submit} className="sticky bottom-0 z-30 border-t border-border bg-background pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
          <PendingAttachments markers={pending} onRemove={(m) => setPending((p) => p.filter((x) => x !== m))} />
          <div className="flex items-end gap-2">
          {user ? (
            <ChatAttachButton disabled={chatLocked} onUploaded={(m) => setPending((p) => [...p, m])} />
          ) : null}
          <VoiceRecordButton
            disabled={chatLocked || busy}
            canUpload={!!user}
            onRecorded={sendVoiceNote}
          />
          <button
            type="button"
            data-emoji-toggle
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
            placeholder={chatLocked ? "Subscribe to keep chatting…" : `Message ${creator.name}…`}
            rows={1}
            className="chat-type min-h-[48px] max-h-32 flex-1 resize-none rounded-[22px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
          {input.trim() || pending.length ? (
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
          </div>
        </form>
        {layer}

      </div>
    </AppShell>
  );
}
