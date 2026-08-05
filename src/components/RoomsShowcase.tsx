import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Users, Circle, Flame, MapPin, Loader2, Plus } from "lucide-react";
import { CITY_ROOMS, DEMO_ROOMS, ROOM_CATEGORIES, haversineMiles, roomImage, type DemoRoom } from "@/lib/demo-rooms";
import { listPublicRooms, listRoomsPublic, joinPublicRoom } from "@/lib/rooms.functions";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";


type Coords = { lat: number; lng: number };

const LS_KEY = "rizz.geo";

function useGeo() {
  const [coords, setCoords] = useState<Coords | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Coords) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = () => {
    if (!("geolocation" in navigator)) {
      setError("Location not supported on this device");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try { window.localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* ignore */ }
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Could not get location");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    );
  };

  return { coords, loading, error, request };
}

export function RoomsShowcase() {
  const [cat, setCat] = useState<(typeof ROOM_CATEGORIES)[number]>("All");
  const { coords, loading, error, request } = useGeo();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchPublic = useServerFn(listPublicRooms);
  const fetchAnon = useServerFn(listRoomsPublic);
  const doJoin = useServerFn(joinPublicRoom);
  const [realRooms, setRealRooms] = useState<any[]>([]);

  // Auto-open the "Near Me" section prompts geo the first time it's picked
  useEffect(() => {
    if (cat === "Near Me" && !coords && !loading && !error) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  // Fetch live public rooms. Signed-out visitors use the anon directory so the
  // rooms rail always shows real rooms instead of preview placeholders.
  useEffect(() => {
    const load = user ? fetchPublic : fetchAnon;
    load({ data: { lat: coords?.lat ?? undefined, lng: coords?.lng ?? undefined } as any })
      .then(setRealRooms).catch(() => setRealRooms([]));
  }, [user, coords, fetchPublic, fetchAnon]);

  // Map real rooms into the DemoRoom shape so they render in the same cards
  const realAsDemo: (DemoRoom & { id?: string; real?: boolean; distance_miles?: number | null })[] =
    realRooms.map((r) => ({
      slug: r.slug || r.id,
      id: r.id,
      real: true,
      name: r.name,
      emoji: r.emoji || "💬",
      tagline: r.description || r.category || "Public room",
      category: (r.category as DemoRoom["category"]) || "Local",
      coHosts: (r.co_hosts as string[]) ?? [],
      official: !!r.is_official,
      members: r.member_count ?? 0,
      online: Math.max(1, Math.floor((r.member_count ?? 0) / 3)),
      gradient: "linear-gradient(135deg,#e84393,#6c5ce7)",
      city: r.city ?? undefined,
      state: r.state ?? undefined,
      lat: r.lat ?? undefined,
      lng: r.lng ?? undefined,
      distance_miles: r.distance_miles ?? null,
    }));

  const rooms = useMemo(() => {
    // Once the real rooms are live they replace the static preview cards.
    const fallback = realAsDemo.length ? [] : DEMO_ROOMS;
    if (cat === "All") return [...realAsDemo, ...fallback];
    if (cat === "Near Me") {
      const merged = [
        ...realAsDemo.filter((r: any) => r.city),
        ...(realAsDemo.length ? [] : CITY_ROOMS.map((r) => ({ ...r, real: false as const }))),
      ];
      if (!coords) return merged;
      return merged
        .map((r: any) => ({
          r,
          d: r.distance_miles ?? (r.lat && r.lng ? haversineMiles(coords, { lat: r.lat, lng: r.lng }) : Infinity),
        }))
        .sort((a, b) => a.d - b.d)
        .map(({ r }) => r);
    }
    return [...realAsDemo, ...fallback].filter((r: any) => r.category === cat);
  }, [cat, coords, realAsDemo]);

  const nearbyRealCount = coords
    ? realAsDemo.filter((r: any) => typeof r.distance_miles === "number" && r.distance_miles <= 50).length
    : realAsDemo.length;

  async function handleClick(room: any) {
    if (!room.real) return; // demo cards keep their existing coming-soon link
    if (!user) { navigate({ to: "/auth" }); return; }
    try {
      await doJoin({ data: { roomId: room.id } });
      navigate({ to: "/rooms/$roomId", params: { roomId: room.id } });
    } catch (e) { toast.error((e as Error).message); }
  }


  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Rooms</p>
          <h2 className="mt-0.5 text-lg font-bold">Jump into the vibe</h2>
        </div>
        <Link to="/rooms" className="text-xs font-semibold text-primary">
          See all →
        </Link>

      </div>

      <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {ROOM_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            style={{
              borderColor: cat === c ? "transparent" : "var(--color-border)",
              background: cat === c ? "var(--gradient-brand)" : "var(--color-card)",
              color: cat === c ? "white" : "var(--color-muted-foreground)",
            }}
          >
            {c === "Near Me" ? "📍 Near Me" : c}
          </button>
        ))}
      </div>

      {cat === "Near Me" ? (
        <div className="mt-3 rounded-2xl border border-border bg-card px-3 py-2 text-xs">
          {loading ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Finding rooms near you…
            </span>
          ) : coords ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" /> Sorted by distance from your location.{" "}
              <button onClick={request} className="ml-1 font-semibold text-primary underline underline-offset-2">
                Refresh
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" /> {error ?? "Share your location to see the closest rooms."}
              <button onClick={request} className="ml-1 font-semibold text-primary underline underline-offset-2">
                Enable location
              </button>
            </span>
          )}
        </div>
      ) : null}

      <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory">
        {rooms.map((r: any) => (
          <RoomCard key={r.id ?? r.slug} room={r} coords={coords} showDistance={cat === "Near Me" && !!coords} onClick={handleClick} />
        ))}
        {cat === "Near Me" && coords && nearbyRealCount === 0 ? (
          <Link
            to="/rooms/new"
            className="relative flex w-[220px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/60 bg-gradient-brand-soft p-4 text-center text-primary active:scale-[0.98]"
          >
            <Plus className="h-6 w-6" />
            <p className="text-sm font-bold">No rooms near you yet</p>
            <p className="text-[11px] font-semibold opacity-80">Be the first — create one</p>
          </Link>
        ) : null}
      </div>

    </section>
  );
}

function RoomCard({ room, coords, showDistance, onClick }: { room: any; coords: Coords | null; showDistance: boolean; onClick?: (room: any) => void }) {
  const miles =
    showDistance && coords && room.lat && room.lng
      ? (typeof room.distance_miles === "number" ? room.distance_miles : haversineMiles(coords, { lat: room.lat, lng: room.lng }))
      : null;

  const img = roomImage(room as DemoRoom);

  const common = {
    className:
      "group relative w-[220px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border shadow-sm transition active:scale-[0.98] text-left",
    style: { background: room.gradient },
  } as const;

  const inner = (
    <>
      {/* Themed photo — city skyline or mood shot */}
      <img
        src={img}
        alt=""
        loading="lazy"
        decoding="async"

        className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-luminosity transition duration-500 group-hover:mix-blend-normal group-hover:scale-105"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      {/* Brand tint on top of photo */}
      <div
        className="absolute inset-0 opacity-60 mix-blend-overlay transition group-hover:opacity-40"
        style={{ background: room.gradient }}
      />
      {/* Romantic hearts pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><text x='6' y='24' font-size='16' fill='white' fill-opacity='0.55'>♡</text></svg>\")",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Bottom readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      <div className="relative flex h-[190px] flex-col justify-between p-3 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {room.city ? `${room.city}${room.state ? `, ${room.state}` : ""}` : room.category}
          </span>
          {room.hot ? (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Flame className="h-3 w-3" /> HOT
            </span>
          ) : room.real ? (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary">LIVE</span>
          ) : null}
        </div>
        <div>
          <p className="text-lg font-bold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{room.name}</p>
          <p className="mt-0.5 text-[11px] opacity-90 drop-shadow">{room.tagline}</p>
          {room.coHosts?.length ? (
            <p className="mt-1 text-[10px] font-semibold opacity-90 drop-shadow">Co-hosts: Cleo · Remy · Lena</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-success text-success" /> {room.online} online
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Users className="h-3 w-3" /> {(room.members ?? 0).toLocaleString()}
            </span>
            {miles !== null ? (
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 backdrop-blur">
                <MapPin className="h-3 w-3" /> {miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  if (room.real) {
    return (
      <button {...common} onClick={() => onClick?.(room)}>
        {inner}
      </button>
    );
  }
  return (
    <Link to="/soon/$feature" params={{ feature: `room-${room.slug}` }} {...common}>
      {inner}
    </Link>
  );
}
