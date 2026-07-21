import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { createRoom } from "@/lib/rooms.functions";
import { toast } from "sonner";
import { MapPin, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/rooms/new")({
  head: () => ({ meta: [{ title: "Create a Room — Rizzla" }] }),
  component: NewRoomPage,
});

function NewRoomPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const create = useServerFn(createRoom);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState("Local");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) return (
    <AppShell>
      <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl">Sign in to create a room</h1>
        <p className="mt-1 text-sm text-muted-foreground">You need a Rizzla account (member or host) to create rooms.</p>
        <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
      </div>
    </AppShell>
  );

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) { toast.error("Location not supported"); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); toast.success("Location added"); },
      (err) => { toast.error(err.message || "Could not get location"); setGeoLoading(false); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Give your room a name"); return; }
    setSaving(true);
    try {
      const row: any = await create({
        data: {
          name, description: desc, isPublic, category,
          city: city || undefined, state: state || undefined,
          lat: coords?.lat, lng: coords?.lng,
        } as any,
      });
      toast.success("Room created ✨");
      navigate({ to: "/rooms/$roomId", params: { roomId: row.id } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div className="pt-4">
        <Link to="/rooms" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to rooms
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Create a room</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Any member can host a public room — great for your city, vibe, or friend circle.
        </p>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Room name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
            placeholder="e.g. Dallas Nights, Sunday Brunch Club"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Tagline / description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={2}
            placeholder="What's this room about?"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              {["Local","Hot","Romance","Flirt","Late Night","Party","Chill"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Visibility</label>
            <select value={isPublic ? "public" : "private"} onChange={(e) => setIsPublic(e.target.value === "public")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="public">Public — discoverable</option>
              <option value="private">Private — invite only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dallas"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="TX"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <button type="button" onClick={useMyLocation}
          className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-brand-soft px-3 py-1.5 text-xs font-semibold text-primary">
          {geoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
          {coords ? `Location added (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : "Use my current location (for Near Me)"}
        </button>

        <button type="submit" disabled={saving} className="btn-brand w-full">
          {saving ? "Creating…" : "Create room"}
        </button>
      </form>
    </AppShell>
  );
}
