import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { listPublicRooms, joinPublicRoom, getRoomAccess } from "@/lib/rooms.functions";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { MapPin, Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/rooms/")({
  head: () => pageHead({
    path: "/rooms",
    title: "Rooms near you \u2014 Crush",
    description: "Join live chat rooms near you. Meet hosts and members in city rooms across the US on Crush.",
  }),

  component: RoomsBrowsePage,
});

function RoomsBrowsePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchPublic = useServerFn(listPublicRooms);
  const doJoin = useServerFn(joinPublicRoom);
  const fetchAccess = useServerFn(getRoomAccess);
  const [access, setAccess] = useState<{ allowed: boolean } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (c?: { lat: number; lng: number } | null) => {
    if (!user) { setRooms([]); setLoading(false); return; }
    setLoading(true);
    fetchPublic({ data: { lat: c?.lat ?? undefined, lng: c?.lng ?? undefined } as any })
      .then(setRooms).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(coords); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => {
    if (!user) { setAccess(null); return; }
    fetchAccess({ data: {} as any }).then(setAccess).catch(() => setAccess(null));
  }, [user, fetchAccess]);

  const askLocation = () => {
    if (!("geolocation" in navigator)) { toast.error("Location not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoords(c); load(c); },
      (err) => toast.error(err.message),
    );
  };

  async function join(id: string) {
    if (!user) { navigate({ to: "/auth" }); return; }
    try { await doJoin({ data: { roomId: id } }); navigate({ to: "/rooms/$roomId", params: { roomId: id } }); }
    catch (e) { toast.error((e as Error).message); }
  }

  if (!user) return (
    <AppShell>
      <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl">Sign in to browse rooms</h1>
        <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="pt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Rooms</p>
          <h1 className="text-2xl font-bold">Public rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">Discover live rooms, or start your own.</p>
        </div>
        <Link to="/rooms/new" className="btn-brand inline-flex shrink-0 items-center gap-1"><Plus className="h-4 w-4" /> Create</Link>
      </div>

      {access && !access.allowed ? (
        <div className="mt-4 rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4">
          <p className="text-sm font-bold text-primary">Rooms are a members-only space</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crush Gold and Diamond members can join every room — with Cleo, Remy and Lena co-hosting so the conversation never dies.
          </p>
          <Link to="/subscriptions" className="btn-brand mt-3 inline-flex">Upgrade to join</Link>
        </div>
      ) : null}

      <button onClick={askLocation} className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-brand-soft px-3 py-1.5 text-xs font-semibold text-primary">
        <MapPin className="h-3 w-3" /> {coords ? "Sorted by distance" : "Sort by rooms near me"}
      </button>

      {loading ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…</p>
      ) : rooms.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-brand-soft p-6 text-center">
          <p className="text-lg font-bold">No public rooms yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first — create one for your city or vibe.</p>
          <Link to="/rooms/new" className="btn-brand mt-4 inline-flex"><Plus className="mr-1 h-4 w-4" /> Create the first room</Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rooms.map((r) => (
            <li key={r.id}>
              <button onClick={() => join(r.id)} className="w-full rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{r.emoji ? `${r.emoji} ` : ""}{r.name}</p>
                  {typeof r.distance_miles === "number" ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {r.distance_miles < 10 ? r.distance_miles.toFixed(1) : Math.round(r.distance_miles)} mi
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.description || r.category || "Public room"}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  {r.city ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.city}{r.state ? `, ${r.state}` : ""}</span> : null}
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.member_count ?? 0}</span>
                </div>
                {(r.co_hosts?.length ?? 0) > 0 ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {(r.co_hosts as string[]).map((id) => (
                        <img key={id} src={hostAvatarThumb(id)} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-card" />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-primary">
                      Co-hosted by {(r.co_hosts as string[]).map((id) => DEMO_HOSTS.find((h) => h.id === id)?.name).filter(Boolean).join(", ")}
                    </span>
                  </div>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
