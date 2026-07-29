import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { dmSendMessage, dmFetchThread } from "@/lib/dm.functions";
import { X, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export type ContactTarget = {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
  subtitle?: string | null;
};

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };

const TEMPLATES: ReadonlyArray<{ label: string; text: (name: string) => string }> = [
  {
    label: "Finish 18+ verification",
    text: (n) =>
      `Hi ${n}, it's the Crush team. To keep your account active you still need to finish the 18+ age verification. It takes 2 minutes — open the app and go to Verify to upload your ID. Reply here if anything gets stuck.`,
  },
  {
    label: "Deadline reminder",
    text: (n) =>
      `Hi ${n}, quick reminder: your 18+ verification deadline has passed. Your account stays with us, but some features are locked until you verify. Head to Verify in the app whenever you're ready.`,
  },
  {
    label: "Need a clearer photo",
    text: (n) =>
      `Hi ${n}, we received your verification but the document photo wasn't clear enough to approve. Please re-upload a well-lit photo where all four corners and the date of birth are readable. Thank you!`,
  },
  {
    label: "Offer help",
    text: (n) => `Hi ${n}, is anything blocking you from completing verification? Tell me here and I'll walk you through it.`,
  },
];

/**
 * Slide-over used inside the admin console to message a user directly about an
 * unresolved verification. Uses the standard DM thread so the user replies in
 * their normal inbox.
 */
export function AdminContactPanel({ target, onClose }: { target: ContactTarget | null; onClose: () => void }) {
  const send = useServerFn(dmSendMessage);
  const fetchThread = useServerFn(dmFetchThread);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const name = target?.name?.trim() || "there";

  const load = async (id: string) => {
    setLoading(true);
    try {
      const rows = (await fetchThread({ data: { peerId: id } })) as Msg[];
      setMessages(rows ?? []);
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!target) return;
    setInput("");
    setMessages([]);
    void load(target.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!target) return null;

  const submit = async (text?: string) => {
    const body = (text ?? input).trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await send({ data: { recipientId: target.id, body } });
      setInput("");
      await load(target.id);
      toast.success(`Message sent to ${target.name || "user"}`);
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <header className="flex items-center gap-3 border-b border-border p-4">
          <img src={target.avatar_url ?? "/favicon.ico"} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{target.name || "(no name)"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{target.subtitle ?? "Direct message"}</p>
          </div>
          <button onClick={() => void load(target.id)} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Refresh">
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
          </button>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {loading && messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Pick a template below to nudge them about verification.
            </p>
          ) : (
            messages.map((m) => {
              const fromMe = m.recipient_id === target.id;
              return (
                <div key={m.id} className={"flex " + (fromMe ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                      (fromMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={"mt-1 text-[10px] " + (fromMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => setInput(t.text(name))}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              rows={3}
              placeholder={`Message ${target.name || "user"}…`}
              className="min-h-[64px] flex-1 resize-none rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => void submit()}
              disabled={busy || !input.trim()}
              className="btn-brand grid h-10 w-10 shrink-0 place-items-center !p-0 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
