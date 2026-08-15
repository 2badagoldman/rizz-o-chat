import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowRight, ChevronRight, Circle, Lock, Send } from "lucide-react";
import { DEMO_HOSTS, AI_HOST_IDS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { saveTasteTranscript } from "@/lib/taste-chat";
import { readMemberMemory, rememberFromMessage, saveMemberName, memberNotes as readMemberNotes } from "@/lib/member-memory";
import { readVisitorName, saveVisitorName } from "@/lib/visitor-name";
import { CreatorVoiceButton, VoiceRecordButton } from "@/components/chat/VoiceNote";

/** How many messages a visitor can send before the paywall lands. */
const FREE_TURNS = 2;

const OPENERS = [
  "Hey — you actually reply?",
  "Say my name in a voice note 👀",
  "What are you doing tonight?",
  "Tell me something no one knows about you",
];

/** Opening line per creator — a hook plus a reason to type back right now. */
const GREETINGS: Record<string, (name: string) => string> = {
  "demo-rubi": (n) =>
    `${n ? n + ", " : ""}be honest — how many people have left you on read this week? 😅 I don't do that. Tell me one thing about your day and I'll send you a voice note back with your name in it.`,
  "demo-aria": (n) =>
    `Hey${n ? " " + n : " you"} 👋 Everyone else scrolls past. I actually read this. Say one line — anything — and I'll reply in seconds, out loud if you want.`,
  "demo-wonderwoman": (n) =>
    `${n ? n + "." : "Okay."} Most people never get a reply from someone like me. You just did. So don't waste it — tell me the one thing you'd never say in someone's DMs 😏`,
};

const DEFAULT_GREETING = (creatorName: string, n: string) =>
  `Hey${n ? " " + n : " you"} 👋 I'm ${creatorName} — and I actually reply. Say one thing to me right now and I'll answer in seconds, in my own voice if you'd like 😏`;

function TypingBubble({ name, avatar }: { name: string; avatar: string }) {
  return (
    <div className="flex items-end gap-2">
      <img src={avatar} alt="" aria-hidden width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3 py-2.5">
        <span className="flex items-center gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:140ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:280ms]" />
        </span>
        <span className="text-xs text-muted-foreground">{name} is typing…</span>
      </div>
    </div>
  );
}

/**
 * Landing-page "taste it" chat. A visitor sends a couple of real messages to a
 * verified creator's AI persona and gets a real reply — the aha moment — before
 * a single dominant CTA appears.
 */
export function TasteChat() {
  // Featured agents that can take the home chat slot. The server always renders
  // the first one (so hydration matches), then we randomise once after mount.
  const featured = useMemo(
    () =>
      ["demo-aria", "demo-rubi"].filter((id) =>
        (AI_HOST_IDS as readonly string[]).includes(id),
      ),
    [],
  );
  const [creatorId, setCreatorId] = useState(() => featured[0] ?? AI_HOST_IDS[0]);
  useEffect(() => {
    if (featured.length > 1) {
      setCreatorId(featured[Math.floor(Math.random() * featured.length)]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const creator = useMemo(
    () => DEMO_HOSTS.find((h) => h.id === creatorId) ?? DEMO_HOSTS[0],
    [creatorId],
  );

  const [input, setInput] = useState("");
  // Her saying your name is the hook — grab it before the first reply.
  const [memberName, setMemberName] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const stored = readMemberMemory().name || readVisitorName();
    setMemberName(stored);
    setNotes(readMemberNotes());
  }, []);
  const transport = useMemo(
    () => new DefaultChatTransport({
        api: "/api/public/demo-chat",
        body: { hostId: creator.id, memberName, memberNotes: notes },
      }),
    [creator.id, memberName, notes],
  );
  const { messages, sendMessage, status } = useChat({ transport });

  const sent = messages.filter((m) => m.role === "user").length;
  const locked = sent >= FREE_TURNS;
  // Voice in, voice back — hearing her is the whole pitch.
  const [autoVoice, setAutoVoice] = useState(false);
  const busy = status === "submitted" || status === "streaming";
  /** She's typing whenever a reply is in flight — the urgency cue. */
  const lastMsg = messages[messages.length - 1];
  const lastText = lastMsg
    ? lastMsg.parts.map((pt) => (pt.type === "text" ? pt.text : "")).join("").trim()
    : "";
  const creatorTyping = busy && (lastMsg?.role === "user" || !lastText);

  // Keep the transcript so it lands in their chat log the moment they join.
  useEffect(() => {
    if (busy) return;
    saveTasteTranscript(creator.id, messages);
  }, [messages, creator.id, busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || locked || busy) return;
    setInput("");
    // Remember his name and anything notable he shares, so she can bring it back.
    const found = rememberFromMessage(t);
    if (found.name) setMemberName(found.name);
    setNotes(readMemberNotes());
    void sendMessage({ text: t });
  };

  const text = (m: (typeof messages)[number]) =>
    m.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();

  return (
    <section id="taste-chat" className="mt-6 overflow-hidden rounded-3xl border border-border bg-card/70 shadow-card backdrop-blur-xl rise-in">
      <Link
        to="/host/$hostId"
        params={{ hostId: creator.id }}
        aria-label={`View ${creator.name}'s profile`}
        className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
      >
        <span className="ring-story block h-10 w-10 shrink-0">
          <img
            src={hostAvatarThumb(creator.id)}
            alt={creator.name}
            width={40}
            height={40}
            className="block h-full w-full rounded-full object-cover"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-display text-sm font-bold">
            {creator.name}, {creator.age}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </p>
          <p className="flex items-center gap-1 text-[11px] text-success">
            <Circle className="h-2 w-2 fill-success text-success" />{" "}
            {creatorTyping ? `${creator.name} is typing…` : "Online now · replies in seconds"}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Tap to view profile
          </p>
        </div>
        <span className="rounded-full bg-gradient-brand-soft px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-foreground/80">
          Free
        </span>
      </Link>

      <div className="max-h-[320px] min-h-[168px] space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm">
            {(GREETINGS[creator.id] ?? ((n: string) => DEFAULT_GREETING(creator.name, n)))(
              memberName,
            )}
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm"
            }
          >
            {text(m) || (busy ? "…" : "")}
            {m.role !== "user" && text(m) ? (
              <CreatorVoiceButton
                text={text(m)}
                hostId={creator.id}
                memberName={memberName}
                autoPlay={autoVoice && m.id === lastMsg?.id && !busy}
                label={memberName ? `Hear her say "${memberName}"` : "Hear her say your name"}
              />
            ) : null}
          </div>
        ))}
        {creatorTyping ? <TypingBubble name={creator.name} avatar={hostAvatarThumb(creator.id)} /> : null}
      </div>

      {locked ? (
        <div className="border-t border-border/60 bg-gradient-brand-soft px-4 py-4 text-center">
          <div className="flex justify-center">
            <TypingBubble name={creator.name} avatar={hostAvatarThumb(creator.id)} />
          </div>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-primary" /> {creator.name} is still typing to you.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            She hasn't left you on read — join free and she picks up right where you stopped.
          </p>
          <Link
            to="/auth"
            search={{ next: `/chat/${creator.id}` }}
            className="btn-brand mt-3 inline-flex w-full items-center justify-center gap-2 hover:btn-brand-hover"
          >
            Keep chatting — it's free to join <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground">
            No card needed — this conversation is saved and waiting in your chats.
          </p>
        </div>
      ) : (
        <div className="border-t border-border/60 px-4 py-3">
          {messages.length === 0 ? (
            <label className="mb-2 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5">
              <span className="shrink-0 text-[11px] font-semibold text-primary">
                So she can say your name:
              </span>
              <input
                value={memberName}
                onChange={(e) => {
                  setMemberName(e.target.value.slice(0, 24));
                  saveVisitorName(e.target.value);
                  saveMemberName(e.target.value);
                }}
                placeholder="Your first name"
                aria-label="Your first name"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          ) : null}
          {messages.length === 0 ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  onClick={() => send(o)}
                  className="press-spring rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
                >
                  {o}
                </button>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${creator.name}…`}
              aria-label={`Message ${creator.name}`}
              className="min-w-0 flex-1 rounded-full border border-border bg-background/70 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <VoiceRecordButton
              disabled={busy}
              onRecorded={({ transcript }) => {
                if (!transcript.trim()) return;
                setAutoVoice(true);
                send(transcript);
              }}
              className="!h-10 !w-10 !rounded-full"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="btn-brand grid h-10 w-10 shrink-0 place-items-center !p-0 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {FREE_TURNS - sent} free {FREE_TURNS - sent === 1 ? "reply" : "replies"} from her — no signup, no card, no waiting.
          </p>
        </div>
      )}
    </section>
  );
}
