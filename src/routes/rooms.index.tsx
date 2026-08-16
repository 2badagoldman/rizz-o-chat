import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { listPublicRooms, listRoomsPublic, joinPublicRoom, getRoomAccess } from "@/lib/rooms.functions";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { MapPin, Plus, Users, Loader2, Search, X } from "lucide-react";
import { STATE_ROOMS, searchRooms, type DemoRoom } from "@/lib/demo-rooms";
import { toast } from "sonner";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { SignedOutGate } from "@/components/SignedOutGate";
import { PrismEmptyState } from "@/components/Prism";

export const Route = createFileRoute("/rooms/")({
  head: () => ({
    ...pageHead({
      path: "/rooms",
      title: "Rooms near you \u2014 Crush",
      description: "Join live chat rooms near you. Meet creators and members in city rooms across the US on Crush.",
      keywords: "chat rooms, group chat, rooms near me, city chat rooms, live chat",
    }),
    scripts: [
      breadcrumbLd([
        { name: "Crush", path: "/" },
        { name: "Rooms near you", path: "/rooms" },
      ]),
    ],
  }),

  component: RoomsBrowsePage,
});


function RoomsBrowsePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchPublic = useServerFn(listPublicRooms);
  const fetchAnon = useServerFn(listRoomsPublic);
  const doJoin = useServerFn(joinPublicRoom);
  const fetchAccess = useServerFn(getRoomAccess);
  const [access, setAccess] = useState<{ allowed: boolean } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [q, setQ] = useState("");

  const PAGE = 30;

  const load = (c?: { lat: number; lng: number } | null) => {
    setLoading(true);
    setExhausted(false);
    // Signed-out visitors read the anon room directory so every live room is
    // browsable before sign-in; joining still requires an account.
    const fetcher = user ? fetchPublic : fetchAnon;
    fetcher({ data: { ...(c ? { lat: c.lat, lng: c.lng } : {}), limit: PAGE } as any })
      .then((r: any[]) => { setRooms(r); setExhausted(r.length < PAGE || !user); })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  // Keyset pagination — ask the server for the next page starting after the
  // oldest room we already have, so page cost stays flat as rooms grow.
  const loadMore = () => {
    if (!user || loadingMore || exhausted || rooms.length === 0) return;
    const oldest = rooms.reduce(
      (min: string, r: any) => (r.created_at < min ? r.created_at : min),
      rooms[0].created_at as string,
    );
    setLoadingMore(true);
    fetchPublic({
      data: { ...(coords ? { lat: coords.lat, lng: coords.lng } : {}), limit: PAGE, cursor: oldest } as any,
    })
      .then((next: any[]) => {
        setExhausted(next.length < PAGE);
        setRooms((prev) => {
          const seen = new Set(prev.map((r: any) => r.id));
          return [...prev, ...next.filter((r: any) => !seen.has(r.id))];
        });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingMore(false));
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
    if (access && !access.allowed) {
      toast.info("Rooms are for Crush Gold and Diamond members.");
      navigate({ to: "/upgrade" });
      return;
    }
    try { await doJoin({ data: { roomId: id } }); navigate({ to: "/rooms/$roomId", params: { roomId: id } }); }
    catch (e) { toast.error((e as Error).message); }
  }


  // Live rooms first; the official state rooms fill in any state that has no
  // member-made room yet, so a search for any of the 50 states always lands.
  const liveMatches = searchRooms(q, rooms as any[]);
  const liveKeys = new Set(
    (rooms as any[]).map((r) => `${(r.city ?? "").toLowerCase()}|${(r.state ?? "").toLowerCase()}`),
  );
  const stateMatches: any[] = q
    ? searchRooms(q, STATE_ROOMS as DemoRoom[])
        .filter((r) => !liveKeys.has(`${(r.city ?? "").toLowerCase()}|${(r.state ?? "").toLowerCase()}`))
        .map((r) => ({
          id: r.slug,
          preview: true,
          name: r.name,
          emoji: r.emoji,
          description: r.tagline,
          category: r.category,
          city: r.city,
          state: r.state,
          member_count: r.members,
        }))
    : [];
  const visibleRooms = [...liveMatches, ...stateMatches];

  if (!user)
    return (
      <SignedOutGate
        title="Sign in to browse rooms"
        description="Rooms are live group chats near you. Sign in to join one, or start your own."
        icon={<Users className="h-6 w-6" />}
      />
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

      {/* State / city search — every US state has an official room. */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a state or city — Texas, MT, Nashville…"
          className="w-full rounded-2xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary/60"
          aria-label="Search rooms by state or city"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <button onClick={askLocation} className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-brand-soft px-3 py-1.5 text-xs font-semibold text-primary">
        <MapPin className="h-3 w-3" /> {coords ? "Sorted by distance" : "Sort by rooms near me"}
      </button>

      {loading ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…</p>
      ) : visibleRooms.length === 0 ? (
        <PrismEmptyState
          className="mt-8"
          icon={<Users className="h-6 w-6" />}
          title="No public rooms yet"
          description="Be the first — start one for your city or your vibe and invite people in."
          action={
            <Link to="/rooms/new" className="btn-brand mt-1 inline-flex items-center">
              <Plus className="mr-1 h-4 w-4" /> Create the first room
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {visibleRooms.map((r) => (
            <li key={r.id}>
              <button onClick={() => (r.preview ? navigate({ to: "/rooms/new" }) : join(r.id))} className="w-full rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/60">
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
                        <img loading="lazy" decoding="async" key={id} src={hostAvatarThumb(id)} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-card" />
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
          {!exhausted && rooms.length > 0 && !q ? (
            <li className="pt-2 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-border/70 bg-card/70 px-5 py-2 text-xs font-bold text-foreground transition active:scale-95 disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more rooms"}
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </AppShell>
  );
}
