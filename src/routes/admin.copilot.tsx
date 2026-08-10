import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminCopilotChat } from "@/lib/war-room.functions";
import { Sparkles, Send, Loader2 } from "lucide-react";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

export const Route = createFileRoute("/admin/copilot")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Admin Copilot — Crush" }] }),
  component: AdminCopilot,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Give me a plain-English summary of the last 24h of traffic.",
  "Draft an email to creators announcing a new referral bonus.",
  "Which pages have the highest engagement and why?",
  "Write copy for a promo slide targeting Dallas members.",
  "Suggest 3 features to boost session length.",
];

function AdminCopilot() {
  const chat = useServerFn(adminCopilotChat);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey — I'm your Crush Admin Copilot. I can read your live 24h analytics, draft copy, brainstorm features, and help you moderate. What are we working on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await chat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply || "(no reply)" }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Error: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-3 flex items-center gap-2">
        <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="" className="h-8 w-8 rounded-full" />
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            Admin Copilot <Sparkles className="h-4 w-4 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">Grounded in your live app analytics · powered by Crush AI brain</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </div>
        ) : null}
      </div>

      {messages.length <= 2 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about traffic, draft copy, or plan a feature…"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn-brand flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" /> Send
        </button>
      </form>
    </div>
  );
}
