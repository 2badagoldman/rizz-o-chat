import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Circle, Flame } from "lucide-react";
import { DEMO_ROOMS, ROOM_CATEGORIES, type DemoRoom } from "@/lib/demo-rooms";

export function RoomsShowcase() {
  const [cat, setCat] = useState<(typeof ROOM_CATEGORIES)[number]>("All");
  const rooms = useMemo(
    () => (cat === "All" ? DEMO_ROOMS : DEMO_ROOMS.filter((r) => r.category === cat)),
    [cat],
  );

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
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory">
        {rooms.map((r) => (
          <RoomCard key={r.slug} room={r} />
        ))}
      </div>
    </section>
  );
}

function RoomCard({ room }: { room: DemoRoom }) {
  return (
    <Link
      to="/soon/$feature"
      params={{ feature: `room-${room.slug}` }}
      className="relative w-[220px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border shadow-sm transition active:scale-[0.98]"
      style={{ background: room.gradient }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="relative flex h-[180px] flex-col justify-between p-3 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {room.category}
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
          <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-success text-success" /> {room.online} online
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Users className="h-3 w-3" /> {room.members.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
