import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import { getRoom, listRoomMessages, sendRoomMessage, listRoomMembers } from "@/lib/rooms.functions";

export const Route = createFileRoute("/rooms/$roomId")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Room — Rizzla" }] }),
  component: RoomChatPage,
});

function RoomChatPage() {
  const { roomId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchRoom = useServerFn(getRoom);
  const fetchMsgs = useServerFn(listRoomMessages);
  const send = useServerFn(sendRoomMessage);
  const fetchMembers = useServerFn(listRoomMembers);

  const [room, setRoom] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchRoom({ data: { roomId } }).then(setRoom).catch((e) => setErr(e.message));
    fetchMsgs({ data: { roomId } }).then(setMsgs).catch((e) => setErr(e.message));
    fetchMembers({ data: { roomId } }).then(setMembers).catch(() => {});
  }, [user, roomId]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        async (payload: any) => {
          const m = payload.new;
          // fetch sender profile lazily
          const { data: prof } = await supabase.from("profiles").select("id, display_name, avatar_url").eq("id", m.sender_id).maybeSingle();
          setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, { ...m, sender: prof ?? null }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const row = await send({ data: { roomId, body } });
      setText("");
      setMsgs((prev) => prev.some((x) => x.id === row.id) ? prev : [...prev, { ...row, sender: { id: user!.id, display_name: user!.email } }]);
    } catch (e) { toast.error((e as Error).message); }
    finally { setSending(false); }
  }

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell><div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl">Sign in to open this room</h1>
        <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
      </div></AppShell>
    );
  }
  if (err) {
    return (
      <AppShell><div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl">Can't open room</h1>
        <p className="mt-2 text-sm text-muted-foreground">{err}</p>
        <button onClick={() => navigate({ to: "/chats" })} className="btn-brand mt-5 inline-flex">Back to chats</button>
      </div></AppShell>
    );
  }
  if (!room) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading room…</p></AppShell>;

  return (
    <AppShell>
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/chats" })} className="rounded-full p-1 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
        <div className="h-9 w-9 grid place-items-center rounded-full bg-gradient-brand text-white"><Users className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{room.name}</p>
          <p className="text-[11px] text-muted-foreground">{members.length + 1} in room · group chat</p>
        </div>
        <button onClick={() => setShowMembers((v) => !v)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary" aria-label="Members">
          <Users className="h-4 w-4" />
        </button>
        {room.is_host ? (
          <Link to="/host/rooms" className="rounded-full border border-border p-2 hover:border-primary hover:text-primary" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {showMembers ? (
        <div className="mt-3 rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Members</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white">Host</span>
            {members.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px]">
                {m.profile?.display_name ?? "Member"}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2 pb-24">
        {msgs.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground pt-10">Say hi 👋 — this is the start of {room.name}.</p>
        ) : msgs.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-gradient-brand text-white" : "bg-card border border-border"}`}>
                {!mine ? <p className="text-[10px] font-semibold text-primary">{m.sender?.display_name ?? "Member"}</p> : null}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSend} className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${room.name}…`}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button type="submit" disabled={sending || !text.trim()} className="btn-brand inline-flex h-11 w-11 items-center justify-center rounded-full p-0 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </AppShell>
  );
}
