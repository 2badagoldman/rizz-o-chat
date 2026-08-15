import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowRight, Circle, Lock, Send } from "lucide-react";
import { DEMO_HOSTS, AI_HOST_IDS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { saveTasteTranscript } from "@/lib/taste-chat";

/** How many messages a visitor can send before the paywall lands. */
const FREE_TURNS = 2;

const OPENERS = [
  "Hey — what are you up to tonight?",
  "What's your ideal first date?",
  "Tell me something no one knows about you",
];

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
  const creator = useMemo(
    () => DEMO_HOSTS.find((h) => h.id === AI_HOST_IDS[0]) ?? DEMO_HOSTS[0],
    [],
  );
  const [input, setInput] = useState("");
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/public/demo-chat", body: { hostId: creator.id } }),
    [creator.id],
  );
  const { messages, sendMessage, status } = useChat({ transport });

  // Keep the transcript so it lands in their chat log the moment they join.
  useEffect(() => {
    if (busyRef.current) return;
    saveTasteTranscript(creator.id, messages);
  }, [messages, creator.id]);

  const sent = messages.filter((m) => m.role === "user").length;
  const locked = sent >= FREE_TURNS;
  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const t = text.trim();
    if (!t || locked || busy) return;
    setInput("");
    void sendMessage({ text: t });
  };

  const text = (m: (typeof messages)[number]) =>
    m.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card/70 shadow-card backdrop-blur-xl rise-in">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
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
          <p className="truncate font-display text-sm font-bold">
            {creator.name}, {creator.age}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-success">
            <Circle className="h-2 w-2 fill-success text-success" />{" "}
            {creatorTyping ? `${creator.name} is typing…` : "Online now · replies in seconds"}
          </p>
        </div>
        <span className="rounded-full bg-gradient-brand-soft px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-foreground/80">
          Free
        </span>
      </div>

      <div className="max-h-[320px] min-h-[168px] space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm">
            Hey you 👋 I'm {creator.name}. Ask me anything — I actually reply.
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
            Join free to keep this conversation going — and message any verified creator.
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
            {FREE_TURNS - sent} free {FREE_TURNS - sent === 1 ? "message" : "messages"} — no signup, no card.
          </p>
        </div>
      )}
    </section>
  );
}
