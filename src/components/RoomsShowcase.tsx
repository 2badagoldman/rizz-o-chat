import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Users, Circle, Flame, MapPin, Loader2, Plus } from "lucide-react";
import { CITY_ROOMS, DEMO_ROOMS, ROOM_CATEGORIES, haversineMiles, type DemoRoom } from "@/lib/demo-rooms";
import { listPublicRooms, joinPublicRoom } from "@/lib/rooms.functions";
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

  // Auto-open the "Near Me" section prompts geo the first time it's picked
  useEffect(() => {
    if (cat === "Near Me" && !coords && !loading && !error) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  const rooms = useMemo(() => {
    if (cat === "All") return DEMO_ROOMS;
    if (cat === "Near Me") {
      if (!coords) return CITY_ROOMS;
      return [...CITY_ROOMS]
        .map((r) => ({ r, d: r.lat && r.lng ? haversineMiles(coords, { lat: r.lat, lng: r.lng }) : Infinity }))
        .sort((a, b) => a.d - b.d)
        .map(({ r }) => r);
    }
    return DEMO_ROOMS.filter((r) => r.category === cat);
  }, [cat, coords]);

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Rooms</p>
          <h2 className="mt-0.5 text-lg font-bold">Jump into the vibe</h2>
        </div>
        <Link to="/soon/$feature" params={{ feature: "rooms" }} className="text-xs font-semibold text-primary">
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
        {rooms.map((r) => (
          <RoomCard key={r.slug} room={r} coords={coords} showDistance={cat === "Near Me" && !!coords} />
        ))}
      </div>
    </section>
  );
}

function RoomCard({ room, coords, showDistance }: { room: DemoRoom; coords: Coords | null; showDistance: boolean }) {
  const miles =
    showDistance && coords && room.lat && room.lng ? haversineMiles(coords, { lat: room.lat, lng: room.lng }) : null;

  return (
    <Link
      to="/soon/$feature"
      params={{ feature: `room-${room.slug}` }}
      className="relative w-[220px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border shadow-sm transition active:scale-[0.98]"
      style={{ background: room.gradient }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="relative flex h-[190px] flex-col justify-between p-3 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {room.city ? `${room.city}, ${room.state}` : room.category}
          </span>
          {room.hot ? (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Flame className="h-3 w-3" /> HOT
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-lg font-bold leading-tight drop-shadow">{room.name}</p>
          <p className="mt-0.5 text-[11px] opacity-90">{room.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-success text-success" /> {room.online} online
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Users className="h-3 w-3" /> {room.members.toLocaleString()}
            </span>
            {miles !== null ? (
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 backdrop-blur">
                <MapPin className="h-3 w-3" /> {miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
