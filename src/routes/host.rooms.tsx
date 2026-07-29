import { PrismEmptyState } from "@/components/Prism";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, MessageCircle, Trash2, Settings, UserPlus, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  listMyRooms, createRoom, deleteRoom, updateRoom,
  listRoomMembers, addRoomMember, removeRoomMember, listFriendsForRoom,
} from "@/lib/rooms.functions";

export const Route = createFileRoute("/host/rooms")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Rooms — Crush" }] }),
  component: HostRoomsPage,
});

function HostRoomsPage() {
  const { user, loading } = useAuth();
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const list = useServerFn(listMyRooms);
  const create = useServerFn(createRoom);
  const del = useServerFn(deleteRoom);
  const update = useServerFn(updateRoom);

  const [rooms, setRooms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [manageId, setManageId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsHost(data?.account_type === "host"));
  }, [user]);

  const reload = () => {
    setRefreshing(true);
    list().then(setRooms).catch((e) => toast.error(e.message)).finally(() => setRefreshing(false));
  };
  useEffect(() => { if (isHost) reload(); /* eslint-disable-next-line */ }, [isHost]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create({ data: { name, description: desc } });
      setName(""); setDesc("");
      toast.success("Room created ✨");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onDelete(id: string, n: string) {
    if (!confirm(`Delete "${n}"? All messages will be lost.`)) return;
    try { await del({ data: { roomId: id } }); toast.success("Room deleted"); reload(); }
    catch (e) { toast.error((e as Error).message); }
  }

  if (loading || isHost === null) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) return (
    <AppShell><div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="text-xl">Sign in as a host</h1>
      <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
    </div></AppShell>
  );
  if (!isHost) return (
    <AppShell><div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="text-xl">Hosts only</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only hosts can create rooms.</p>
    </div></AppShell>
  );

  const managed = rooms.find((r) => r.id === manageId);

  return (
    <AppShell>
      <div className="pt-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Host tools</p>
        <h1 className="text-2xl font-bold">Rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Group your Friends List into private rooms — like WhatsApp groups. 1-on-1 chats stay separate.
        </p>
      </div>

      <form onSubmit={onCreate} className="mt-5 rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Plus className="h-4 w-4" /> New room
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name (e.g. VIP Lounge, Sunday Brunch)"
          className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional description"
          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="btn-brand mt-3 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Create room
        </button>
      </form>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Your rooms</h2>
        {refreshing ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
        ) : rooms.length === 0 ? (
          <PrismEmptyState
            className="mt-3"
            title="No rooms yet"
            description="Create your first room above and start moving friends into it."
          />

        ) : (
          <div className="mt-3 space-y-2">
            {rooms.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 grid place-items-center rounded-full bg-gradient-brand text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    {r.description ? <p className="truncate text-[11px] text-muted-foreground">{r.description}</p> : null}
                  </div>
                  <Link to="/rooms/$roomId" params={{ roomId: r.id }} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary" aria-label="Open">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Link>
                  {r.role === "host" ? (
                    <>
                      <button onClick={() => setManageId(r.id)} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary" aria-label="Manage">
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDelete(r.id, r.name)} className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {managed ? (
        <ManageRoomModal
          room={managed}
          onClose={() => setManageId(null)}
          onRenamed={(patch) => setRooms((rs) => rs.map((r) => r.id === managed.id ? { ...r, ...patch } : r))}
          update={update}
        />
      ) : null}
    </AppShell>
  );
}

function ManageRoomModal({ room, onClose, onRenamed, update }: {
  room: any; onClose: () => void; onRenamed: (patch: any) => void; update: any;
}) {
  const listFriends = useServerFn(listFriendsForRoom);
  const listMembers = useServerFn(listRoomMembers);
  const addMember = useServerFn(addRoomMember);
  const removeMember = useServerFn(removeRoomMember);

  const [friends, setFriends] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(room.name);
  const [desc, setDesc] = useState(room.description ?? "");

  const reload = () => {
    setLoading(true);
    Promise.all([
      listFriends({ data: { roomId: room.id } }),
      listMembers({ data: { roomId: room.id } }),
    ]).then(([f, m]) => { setFriends(f); setMembers(m); })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, [room.id]);

  async function toggle(userId: string, inRoom: boolean, dispName: string) {
    try {
      if (inRoom) {
        await removeMember({ data: { roomId: room.id, userId } });
        toast.success(`${dispName} removed`);
      } else {
        await addMember({ data: { roomId: room.id, userId } });
        toast.success(`${dispName} added`);
      }
      reload();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function saveMeta() {
    try {
      await update({ data: { roomId: room.id, name, description: desc } });
      onRenamed({ name, description: desc });
      toast.success("Saved");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Manage room</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-3 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <button onClick={saveMeta} className="btn-brand w-full">Save</button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">In this room ({members.length})</p>
          {loading ? <p className="mt-2 text-xs text-muted-foreground">Loading…</p> : members.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No members yet.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                  <div className="h-7 w-7 grid place-items-center rounded-full bg-gradient-brand text-[10px] font-bold text-white">
                    {(m.profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">{m.profile?.display_name ?? "Member"}</p>
                  <button onClick={() => toggle(m.user_id, true, m.profile?.display_name ?? "Member")}
                    className="rounded-full border border-border px-2 py-1 text-[10px] hover:border-destructive hover:text-destructive">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Add from Friends List</p>
          {loading ? null : friends.filter((f) => !f.in_room).length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Everyone in your list is already in this room. <Link to="/host/members" className="text-primary underline">Add more friends →</Link></p>
          ) : (
            <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
              {friends.filter((f) => !f.in_room).map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                  <div className="h-7 w-7 grid place-items-center rounded-full bg-gradient-brand text-[10px] font-bold text-white">
                    {(f.display_name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">{f.display_name ?? "Friend"}</p>
                  <button onClick={() => toggle(f.id, false, f.display_name ?? "Friend")}
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-2.5 py-1 text-[10px] font-semibold text-white">
                    <UserPlus className="h-3 w-3" /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/rooms/$roomId" params={{ roomId: room.id }} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border p-2 text-sm font-semibold hover:border-primary hover:text-primary">
          Open room chat <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
