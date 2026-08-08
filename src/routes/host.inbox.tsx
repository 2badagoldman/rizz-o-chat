import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CheckCheck, Inbox, Loader2, MailOpen, Send, Users } from "lucide-react";
import { inboxThreads, markThreadsRead, bulkReply, broadcastToRooms, type InboxThread } from "@/lib/host-inbox.functions";
import { listMyRooms } from "@/lib/rooms.functions";
import { previewChatBody } from "@/lib/chat-media";
import { RestrictedGroupPanel } from "@/components/host/RestrictedGroupPanel";


import { PageSkeleton } from "@/components/AuthGate";
import { SignedOutGate } from "@/components/SignedOutGate";
export const Route = createFileRoute("/host/inbox")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Inbox manager — Crush" },
      { name: "description", content: "Bulk read and bulk reply to your Crush messages when volume gets heavy." },
      { property: "og:title", content: "Inbox manager — Crush" },
      { property: "og:description", content: "Bulk read and bulk reply to your Crush messages when volume gets heavy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HostInbox,
});

const TEMPLATES = [
  "hey you 💕 just catching up on messages — tell me one thing about your day",
  "thank you for the love today 🥹 replying to everyone one by one, you're next",
  "posting something new in the Friends List tonight — don't miss it ✨",
];

function HostInbox() {
  const { user, loading } = useAuth();
  const load = useServerFn(inboxThreads);
  const markRead = useServerFn(markThreadsRead);
  const sendBulk = useServerFn(bulkReply);

  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"unread" | "all">("unread");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const loadRooms = useServerFn(listMyRooms);
  const postRooms = useServerFn(broadcastToRooms);
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [pickedRooms, setPickedRooms] = useState<Set<string>>(new Set());
  const [roomReply, setRoomReply] = useState("");
  const [roomSending, setRoomSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadRooms({})
      .then((rs: any[]) => setRooms((rs ?? []).map((r) => ({ id: r.id, name: r.name }))))
      .catch(() => {});
  }, [user, loadRooms]);

  const doRoomBroadcast = async () => {
    const ids = Array.from(pickedRooms);
    setRoomSending(true);
    try {
      const res = await postRooms({ data: { roomIds: ids, body: roomReply } });
      toast.success(`Posted to ${res.sent} room${res.sent === 1 ? "" : "s"}`);
      setRoomReply("");
      setPickedRooms(new Set());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRoomSending(false);
    }
  };


  const refresh = useCallback(() => {
    setBusy(true);
    load({})
      .then((rows) => setThreads(rows))
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setBusy(false));
  }, [load]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const visible = useMemo(
    () => (filter === "unread" ? threads.filter((t) => t.unread > 0) : threads),
    [threads, filter],
  );
  const unreadTotal = threads.reduce((n, t) => n + t.unread, 0);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(visible.map((t) => t.peerId)));
  const clearAll = () => setSelected(new Set());

  const doMarkRead = async (ids: string[]) => {
    if (!ids.length) return toast.error("Pick at least one conversation");
    try {
      await markRead({ data: { peerIds: ids } });
      setThreads((t) => t.map((x) => (ids.includes(x.peerId) ? { ...x, unread: 0 } : x)));
      clearAll();
      toast.success(`Marked ${ids.length} conversation${ids.length > 1 ? "s" : ""} read`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const doBulkReply = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return toast.error("Select who this goes to");
    setSending(true);
    try {
      const res = await sendBulk({ data: { peerIds: ids, body: reply } });
      toast.success(`Sent to ${res.sent} ${res.sent === 1 ? "person" : "people"}`);
      setReply("");
      clearAll();
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <AppShell><PageSkeleton /></AppShell>;
  if (!user) {
    return (
      <SignedOutGate
        title="Sign in to manage your inbox"
        description="Your member messages, room activity and requests are waiting behind sign-in."
      />
    );
  }

  return (
    <AppShell>
      <header className="pt-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Notifications</p>
        <h1 className="text-2xl flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" /> Inbox manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unreadTotal} unread across {threads.length} conversation{threads.length === 1 ? "" : "s"} — quick read them or fire off one reply to everybody.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-border p-0.5">
          {(["unread", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "bg-gradient-brand text-white" : "text-muted-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={selectAll} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-primary">
          Select all ({visible.length})
        </button>
        {selected.size ? (
          <button onClick={clearAll} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-primary">
            Clear ({selected.size})
          </button>
        ) : null}
        <button
          onClick={() => doMarkRead(threads.filter((t) => t.unread > 0).map((t) => t.peerId))}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>

      {busy ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading your messages…</p>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <MailOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === "unread" ? "You're all caught up 🎉" : "No conversations yet."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((t) => {
            const on = selected.has(t.peerId);
            return (
              <li
                key={t.peerId}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${on ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(t.peerId)}
                  aria-label={`Select conversation with ${t.name}`}
                  className="h-5 w-5 accent-[hsl(var(--primary))]"
                />
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
                  {t.avatar ? (
                    <img loading="lazy" decoding="async" src={t.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    t.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <Link
                  to="/chat/user/$userId"
                  params={{ userId: t.peerId }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.lastFromMe ? "You: " : ""}{previewChatBody(t.lastBody) || "…"}
                  </p>
                </Link>
                {t.unread ? (
                  <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[11px] font-bold text-white">
                    {t.unread}
                  </span>
                ) : null}
                <button
                  onClick={() => doMarkRead([t.peerId])}
                  aria-label={`Mark ${t.name} read`}
                  className="rounded-full border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section className="sticky bottom-3 mt-5 rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-glow backdrop-blur">
        <h2 className="text-sm font-semibold">Bulk reply {selected.size ? `· ${selected.size} selected` : ""}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => setReply(t)}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              {t.slice(0, 34)}…
            </button>
          ))}
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="One message, everyone selected gets it…"
          className="chat-type mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={doBulkReply}
            disabled={sending || !reply.trim() || !selected.size}
            className="btn-brand inline-flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {selected.size || 0}
          </button>
          <button
            onClick={() => doMarkRead(Array.from(selected))}
            disabled={!selected.size}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50 hover:border-primary"
          >
            Mark selected read
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/80 p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Reply in your rooms
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Everyone in the room sees it instantly — no refresh needed.
        </p>
        {rooms.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No rooms yet. <Link to="/host/rooms" className="text-primary underline">Create one</Link>.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rooms.map((r) => {
                const on = pickedRooms.has(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() =>
                      setPickedRooms((s) => {
                        const next = new Set(s);
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                        return next;
                      })
                    }
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
            <textarea
              value={roomReply}
              onChange={(e) => setRoomReply(e.target.value)}
              rows={2}
              placeholder="Say something to the room…"
              className="chat-type mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
            />
            <button
              onClick={doRoomBroadcast}
              disabled={roomSending || !roomReply.trim() || !pickedRooms.size}
              className="btn-brand mt-2 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {roomSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post to {pickedRooms.size || 0} room{pickedRooms.size === 1 ? "" : "s"}
            </button>
          </>
        )}
      </section>
      <RestrictedGroupPanel />
    </AppShell>
  );
}

