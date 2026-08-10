import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { createAuthedChatTransport } from "@/lib/authed-chat-transport";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/AppShell";
import { Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { pageHead, breadcrumbLd } from "@/lib/seo";


export const Route = createFileRoute("/copilot")({
  head: () => ({
    ...pageHead({
      path: "/copilot",
      title: "Crush AI copilot \u2014 your chat wingman",
      description: "The AI wingman inside Crush. Get help crafting messages, breaking the ice, and building real chats.",
      keywords: "ai wingman, chat opener ideas, flirting help, ai copilot",
    }),
    scripts: [
      breadcrumbLd([
        { name: "Crush", path: "/" },
        { name: "AI copilot", path: "/copilot" },
      ]),
    ],
  }),
  component: Copilot,
});



function Copilot() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: createAuthedChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  const suggested = user
    ? [
        "Walk me through applying to be a Creator",
        "How do I hit 100 Friends and unlock 65%?",
        "Help me pick a Creator to subscribe to",
        "What should my first message be?",
      ]
    : [
        "What is Crush Social?",
        "How much can Creators earn?",
        "Explain the Milestone Flip",
        "Is this a dating app?",
      ];

  return (
    <AppShell hideNav>
      <div className="flex min-h-[calc(100vh-1rem)] flex-col">
        <header className="flex items-center gap-3 pt-3 pb-2">
          <Link to="/" aria-label="Back to home" className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 overflow-hidden rounded-full shadow-glow">
              <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="Crush AI" className="h-full w-full object-cover" />
            </div>

            <div>
              <h1 className="text-base font-semibold leading-tight">Crush AI</h1>
              <p className="text-[11px] text-muted-foreground">Your in-app copilot</p>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm">
                Hey — I&apos;m <span className="text-gradient-brand font-semibold">Crush AI</span>. I&apos;ll walk you through
                anything in the app: applying as a Creator, pricing your Friends List, picking who to chat with, or
                writing your first message. Ask me anything.
              </p>
              <div className="mt-4 grid gap-2">
                {suggested.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage({ text: s })}
                    className="rounded-xl border border-border bg-background/50 px-3 py-2 text-left text-sm hover:border-primary/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => {
            const isUser = m.role === "user";
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    isUser
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2 text-sm text-white shadow-glow"
                      : "max-w-[92%] text-sm leading-relaxed"
                  }
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{text}</p>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-headings:mt-3 prose-headings:mb-1">
                      <ReactMarkdown>{text || "…"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {busy && messages[messages.length - 1]?.role === "user" ? (
            <p className="text-xs text-muted-foreground animate-pulse">Crush AI is thinking…</p>
          ) : null}
        </div>

        <form onSubmit={submit} className="sticky bottom-0 z-30 flex items-end gap-2 border-t border-border bg-background pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="Ask Crush AI anything…"
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
