import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createAuthedChatTransport } from "@/lib/authed-chat-transport";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Send, Circle, Gift, Sparkles, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS, isAiHost } from "@/lib/demo-hosts";
import { hostAvatar } from "@/lib/host-avatars";
import { sendChatGift } from "@/lib/subscriptions.functions";
import { toast } from "sonner";

// Jen is a demo id — coin economy only applies to real host UUIDs.
const JEN_UUID = "0dc3f76d-b710-4934-b1e5-4057ccdb082b";


export const Route = createFileRoute("/chat/$hostId")({
  head: () => ({
    meta: [{ title: "Chat — Rizzla" }],
  }),
  component: HostChat,
});

const GIFTS: Array<{ emoji: string; label: string; coins: number }> = [
  { emoji: "🌹", label: "Rose", coins: 100 },
  { emoji: "🍫", label: "Chocolate", coins: 250 },
  { emoji: "🧸", label: "Teddy", coins: 500 },
  { emoji: "💎", label: "Diamond", coins: 2500 },
];

function HostChat() {
  const { hostId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const host = DEMO_HOSTS.find((h) => h.id === hostId);
  const aiHost = isAiHost(hostId);
  const isJen = hostId === "demo-jen";

  // Welcome-to-Friends-List animation when the user just joined (set by
  // the host profile page in localStorage under `rizzla:welcome:<hostId>`).
  const [welcome, setWelcome] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `rizzla:welcome:${hostId}`;
    if (localStorage.getItem(key) === "1") {
      setWelcome(true);
      localStorage.removeItem(key);
      const t = setTimeout(() => setWelcome(false), 2400);
      return () => clearTimeout(t);
    }
  }, [hostId]);

  // AI hosts stream from the public endpoint (no auth required); everyone else
  // goes through the authenticated host-chat endpoint.
  const transport = useMemo(() => {
    if (aiHost) {
      return new DefaultChatTransport({ api: "/api/public/demo-chat", body: { hostId } });
    }
    return createAuthedChatTransport({ api: "/api/host-chat", body: { hostId } });
  }, [aiHost, hostId]);

  const { messages, sendMessage, status } = useChat({ transport });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-3">
          {aiHost && !user ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-[11px] text-primary flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Free preview chat with {host.name}. Sign up to unlock gifts, Rooms & photo/video shares.
            </div>
          ) : null}
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              {isJen
                ? "hey! so glad you're actually testing this with me 💌 tell me something about your day"
                : `hey — ${host.teaser.toLowerCase()} what's up with you?`}
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
