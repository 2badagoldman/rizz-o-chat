import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { uniqueChannel, safeRemoveChannel } from "@/lib/realtime";
import { ArrowLeft, Send, Users, Settings, Smile } from "lucide-react";
import { toast } from "sonner";
import { getRoom, listRoomMessages, sendRoomMessage, listRoomMembers, requestCoHostReply } from "@/lib/rooms.functions";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { ChatSkinPicker, useChatSkin } from "@/lib/chat-theme";
import { SignedOutGate } from "@/components/SignedOutGate";


export const Route = createFileRoute("/rooms/$roomId")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Room — Crush" }] }),
  component: RoomChatPage,
});

const ROOM_EMOJIS = ["😀","😂","🥰","😍","😉","😎","🤗","🙌","👋","👏","💗","💕","✨","🎉","☕","🌸","🌊","🔆","💬","🙏","😅","🤝","👀","💯"];

function RoomChatPage() {
  const { roomId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchRoom = useServerFn(getRoom);
  const fetchMsgs = useServerFn(listRoomMessages);
  const send = useServerFn(sendRoomMessage);
  const fetchMembers = useServerFn(listRoomMembers);
  const nudgeCoHost = useServerFn(requestCoHostReply);

  const [room, setRoom] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [coHostTyping, setCoHostTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { skin, setSkin, highContrast, setHighContrast, contrastAttr } = useChatSkin(`room:${roomId}`);


  useEffect(() => {
    if (!user) return;
    fetchRoom({ data: { roomId } }).then(setRoom).catch((e) => setErr(e.message));
    fetchMsgs({ data: { roomId } }).then(setMsgs).catch((e) => setErr(e.message));
    fetchMembers({ data: { roomId } }).then(setMembers).catch(() => {});
  }, [user, roomId]);

  useEffect(() => {
    if (!user) return;
    let ch: ReturnType<typeof uniqueChannel> | null = null;
    try {
      ch = uniqueChannel(`room-${roomId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
          async (payload: any) => {
            const m = payload.new;
            // fetch sender profile lazily (AI co-hosts have no profile row)
            const { data: prof } = m.sender_id
              ? await supabase.from("profiles").select("id, display_name, avatar_url").eq("id", m.sender_id).maybeSingle()
              : { data: null };
            setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, { ...m, sender: prof ?? null }]);
          })
        .subscribe();
    } catch {
      /* ignore realtime setup failures */
    }
    return () => { safeRemoveChannel(ch); };
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
      // Let a co-host take a turn if the human host is away — reply arrives over realtime.
      setCoHostTyping(true);
      nudgeCoHost({ data: { roomId } })
        .catch(() => {})
        .finally(() => setCoHostTyping(false));
    } catch (e) { toast.error((e as Error).message); }
    finally { setSending(false); }
  }

  if (loading) return <AppShell><PageSkeleton /></AppShell>;
  if (!user) {
    return (
      <SignedOutGate
        title="Sign in to open this room"
        description="Rooms are live group chats. Sign in to read along and join the conversation."
      />
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
      <div data-chat-skin={skin} data-chat-contrast={contrastAttr} className="chat-wallpaper -mx-4 px-4">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/chats" })} aria-label="Back to chats" className="rounded-full p-1 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
        <div className="h-9 w-9 grid place-items-center rounded-full bg-gradient-brand text-white"><Users className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{room.name}</h1>
          <p className="text-[11px] text-muted-foreground">{members.length + 1} in room · group chat</p>
          {(room.co_hosts?.length ?? 0) > 0 ? (
            <p className="flex items-center gap-1 text-[10px] text-primary">
              Co-hosts:{" "}
              {(room.co_hosts as string[]).map((id) => DEMO_HOSTS.find((h) => h.id === id)?.name).filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
        <ChatSkinPicker skin={skin} onChange={setSkin} highContrast={highContrast} onHighContrastChange={setHighContrast} />
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
          const mine = !!m.sender_id && m.sender_id === user.id;
          const ai = m.ai_host_id ? DEMO_HOSTS.find((h) => h.id === m.ai_host_id) : null;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {ai ? (
                <img loading="lazy" decoding="async" src={hostAvatarThumb(ai.id)} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover ring-2 ring-primary/40" />
              ) : null}
              <div className={`max-w-[80%] rounded-[22px] px-4 py-2.5 ${mine ? "rounded-br-md chat-bubble-mine" : "rounded-bl-md chat-bubble-peer"}`}>
                {!mine ? (
                  <p className="chat-meta flex items-center gap-1 opacity-70">
                    {ai ? ai.name : m.sender?.display_name ?? "Member"}
                    {ai ? <span className="rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary">Co-host</span> : null}
                  </p>
                ) : null}
                <p className="chat-type whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          );
        })}
        {coHostTyping ? (
          <p className="chat-meta pl-2 text-muted-foreground">A co-host is typing…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>
      </div>


      <form onSubmit={onSend} className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur">
        {emojiOpen ? (
          <div className="mx-auto mb-2 flex max-w-2xl flex-wrap gap-1 rounded-2xl border border-border bg-card p-2">
            {ROOM_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setText((v) => v + e)}
                className="rounded-full px-2 py-1 text-xl transition hover:bg-muted"
                aria-label={`Add ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Emoji"
            aria-expanded={emojiOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${room.name}…`}
            className="chat-type flex-1 rounded-full border border-border bg-card px-5 py-3 outline-none focus:border-primary"
          />
          <button type="submit" aria-label="Send message" disabled={sending || !text.trim()} className="btn-brand inline-flex h-11 w-11 items-center justify-center rounded-full p-0 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] text-muted-foreground">
          Rooms are text &amp; emoji only — share photos or video in a one-on-one chat.
        </p>
      </form>
    </AppShell>
  );
}
