import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { createAuthedChatTransport } from "@/lib/authed-chat-transport";
import ReactMarkdown from "react-markdown";
import { Send, X, ChevronDown, Paperclip, Image as ImageIcon } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const DISMISS_KEY = "rizz_brain_dock_dismissed_v1";


export function RizzBrainDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    if (typeof window === "undefined") return;
    // Always reset dismissal on app load so the icon reappears every session
    sessionStorage.removeItem(DISMISS_KEY);
    setDismissed(false);
  }, []);


  const { messages, sendMessage, status } = useChat({
    transport: createAuthedChatTransport({ api: "/api/chat" }),
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
    if ((!t && files.length === 0) || busy) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    sendMessage({ text: t || "What should I say? Coach me with 3 options.", files: files.length ? dt.files : undefined });
    setInput("");
    setFiles([]);
    if (!open) setOpen(true);
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, 3);
    setFiles((prev) => [...prev, ...imgs].slice(0, 3));
  };


  return (
    <>
      {/* Mini floating chat panel */}
      {open ? (
        <div
          className="fixed z-[60] flex flex-col rounded-3xl border border-white/20 bg-card/40 shadow-glow overflow-hidden backdrop-blur-2xl backdrop-saturate-150"
          style={{
            right: "max(0.75rem, env(safe-area-inset-right))",
            bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)",
            width: "min(340px, calc(100vw - 1.5rem))",
            height: "min(58vh, 500px)",
          }}
        >
          <div className="flex items-center justify-between border-b border-white/15 px-3 py-2 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 overflow-hidden rounded-full shadow-glow">
                <img src={rizzAiLogo.url} alt="Rizz AI" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight">Rizz AI</p>
                <p className="text-[10px] text-muted-foreground">Your copilot</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                aria-label="Minimize"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-background"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={dismiss}
                aria-label="Dismiss for session"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-border bg-background/40 p-3">
                <p className="text-sm">
                  Hey — I&apos;m <span className="text-gradient-brand font-semibold">Rizz AI</span>. Ask me anything.
                </p>
                <div className="mt-3 grid gap-1.5">
                  {[
                    "How do Friends Lists work?",
                    "Walk me through applying as a Host",
                    "Help me pick a Host",
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

          <form onSubmit={submit} className="flex items-end gap-2 border-t border-white/15 bg-white/5 px-2 py-2">
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
              className="min-h-[36px] max-h-24 flex-1 resize-none rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm outline-none backdrop-blur focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      {/* Floating icon button (bottom-right, above bottom nav) */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Rizz AI"
          className="fixed z-40 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/20 shadow-glow backdrop-blur-xl backdrop-saturate-150 transition-transform hover:scale-105 active:scale-95"
          style={{
            right: "max(0.75rem, env(safe-area-inset-right))",
            bottom: "calc(env(safe-area-inset-bottom) + 4.25rem)",
          }}
        >
          <img src={rizzAiLogo.url} alt="Rizz AI" className="h-8 w-8 rounded-full object-cover" />
        </button>
      ) : null}
    </>
  );
}
