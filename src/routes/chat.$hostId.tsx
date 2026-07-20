import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send, Circle, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

export const Route = createFileRoute("/chat/$hostId")({
  head: () => ({
    meta: [{ title: "Chat — Rizzla" }],
  }),
  component: HostChat,
});

function HostChat() {
  const { hostId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const host = DEMO_HOSTS.find((h) => h.id === hostId);
  const isJen = hostId === "demo-jen";

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/host-chat", body: { hostId } }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl">Sign in to chat</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  if (!host) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Host not found</h1>
        </div>
      </AppShell>
    );
  }

  if (!isJen) {
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <AppShell hideNav>
      <div className="flex min-h-[calc(100vh-1rem)] flex-col">
        <header className="flex items-center gap-3 pt-3 pb-2">
          <button onClick={() => navigate({ to: "/host/$hostId", params: { hostId } })} className="rounded-full border border-border p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-glow" style={{ background: host.gradient }}>
              <img src={rizzAiLogo.url} alt="" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">{host.name}</h1>
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <Circle className="h-2 w-2 fill-emerald-500" /> Online
              </p>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              hey! so glad you&apos;re actually testing this with me 💌 tell me something about your day
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
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2 text-sm text-white shadow-glow"
                      : "max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2 text-sm"
                  }
                >
                  <p className="whitespace-pre-wrap">{text || "…"}</p>
                </div>
              </div>
            );
          })}

          {busy && messages[messages.length - 1]?.role === "user" ? (
            <p className="pl-2 text-xs text-muted-foreground animate-pulse">{host.name} is typing…</p>
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
            placeholder={`Message ${host.name}…`}
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
