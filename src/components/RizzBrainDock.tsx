import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { Send, X, ChevronDown } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const DISMISS_KEY = "rizz_brain_dock_dismissed_v1";

export function RizzBrainDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, status, open]);

  // Never render on auth or copilot fullscreen page
  if (dismissed) return null;
  if (pathname === "/auth" || pathname === "/copilot") return null;

  const busy = status === "submitted" || status === "streaming";

  const dismiss = () => {
    if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setOpen(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
    if (!open) setOpen(true);
  };

  return (
    <>
      {/* Expanded panel */}
      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex w-full max-w-[480px] flex-col rounded-t-3xl border-t border-border bg-card shadow-glow" style={{ height: "min(78vh, 640px)" }}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-full shadow-glow">
                <img src={rizzAiLogo.url} alt="Rizz AI" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Rizz AI</p>
                <p className="text-[10px] text-muted-foreground">Your in-app copilot</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                aria-label="Minimize"
                className="rounded-full p-2 text-muted-foreground hover:bg-background"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={dismiss}
                aria-label="Dismiss for session"
                className="rounded-full p-2 text-muted-foreground hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-border bg-background/40 p-3">
                <p className="text-sm">
                  Hey — I&apos;m <span className="text-gradient-brand font-semibold">Rizz AI</span>. Ask me anything about the app.
                </p>
                <div className="mt-3 grid gap-1.5">
                  {[
                    "How do Friends Lists work?",
                    "Walk me through applying as a Host",
                    "Help me pick a Host to subscribe to",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage({ text: s })}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-left text-xs hover:border-primary/60"
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
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-brand px-3 py-2 text-sm text-white shadow-glow"
                        : "max-w-[92%] text-sm leading-relaxed"
                    }
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{text}</p>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5">
                        <ReactMarkdown>{text || "…"}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {busy && messages[messages.length - 1]?.role === "user" ? (
              <p className="text-xs text-muted-foreground animate-pulse">Rizz AI is thinking…</p>
            ) : null}
          </div>

          <form onSubmit={submit} className="flex items-end gap-2 border-t border-border bg-card px-3 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
              placeholder="Ask Rizz AI…"
              rows={1}
              className="min-h-[40px] max-h-24 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      {/* Docked mini-bar (hidden while expanded) */}
      {!open ? (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-[480px] px-3 pb-1">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-2 py-1.5 shadow-card backdrop-blur">
            <button
              onClick={() => setOpen(true)}
              className="flex flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left"
              aria-label="Open Rizz AI"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand shadow-glow">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="truncate text-xs text-muted-foreground">
                Ask <span className="text-gradient-brand font-semibold">Rizz AI</span> anything…
              </span>
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss Rizz AI for this session"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-background"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
