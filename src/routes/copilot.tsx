import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/AppShell";
import { Sparkles, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "Rizz Brain — your copilot" },
      { name: "description", content: "The AI copilot inside Rizzla Social. Get walked through every step of the app." },
    ],
  }),
  component: Copilot,
});

function Copilot() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
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
        "Walk me through applying to be a Host",
        "How do I hit 100 Friends and unlock 65%?",
        "Help me pick a Host to subscribe to",
        "What should my first message be?",
      ]
    : [
        "What is Rizzla Social?",
        "How much can Hosts earn?",
        "Explain the Milestone Flip",
        "Is this a dating app?",
      ];

  return (
    <AppShell hideNav>
      <div className="flex min-h-[calc(100vh-1rem)] flex-col">
        <header className="flex items-center gap-3 pt-3 pb-2">
          <Link to="/" className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Rizz Brain</h1>
              <p className="text-[11px] text-muted-foreground">Your in-app copilot</p>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm">
                Hey — I&apos;m <span className="text-gradient-brand font-semibold">Rizz Brain</span>. I&apos;ll walk you through
                anything in the app: applying as a Host, pricing your Friends List, picking who to chat with, or
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
            <p className="text-xs text-muted-foreground animate-pulse">Rizz Brain is thinking…</p>
          ) : null}
        </div>

        <form onSubmit={submit} className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background/95 pb-3 pt-3 backdrop-blur">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="Ask Rizz Brain anything…"
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
