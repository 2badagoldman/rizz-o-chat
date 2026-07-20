import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Upload, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/showcase")({
  component: AdminShowcase,
});

interface Row {
  id: string;
  caption: string | null;
  media_type: "image" | "video";
  storage_path: string;
  sort_order: number;
  is_active: boolean;
  url?: string;
}

function AdminShowcase() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, [user, loading, navigate]);

  const refresh = async () => {
    const { data } = await supabase
      .from("showcase_media")
      .select("id, caption, media_type, storage_path, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!data) return;
    const signed = await Promise.all(
      data.map(async (r) => {
        const { data: s } = await supabase.storage.from("showcase").createSignedUrl(r.storage_path, 3600);
        return { ...r, url: s?.signedUrl } as Row;
      }),
    );
    setRows(signed);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null); setBusy(true);
    try {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) throw new Error("Upload an image or video");
      const maxMB = isVideo ? 100 : 15;
      if (file.size > maxMB * 1024 * 1024) throw new Error(`File exceeds ${maxMB}MB`);
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("showcase").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("showcase_media").insert({
        uploader_id: user.id,
        storage_path: path,
        media_type: isVideo ? "video" : "image",
        caption: caption || null,
        sort_order: rows.length,
        is_active: true,
      });
      if (insErr) throw insErr;
      setCaption("");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const remove = async (row: Row) => {
    if (!confirm("Delete this showcase item?")) return;
    await supabase.storage.from("showcase").remove([row.storage_path]);
    await supabase.from("showcase_media").delete().eq("id", row.id);
    await refresh();
  };

  const toggle = async (row: Row) => {
    await supabase.from("showcase_media").update({ is_active: !row.is_active }).eq("id", row.id);
    await refresh();
  };

  const editCaption = async (row: Row) => {
    const next = prompt("Caption", row.caption ?? "");
    if (next === null) return;
    await supabase.from("showcase_media").update({ caption: next || null }).eq("id", row.id);
    await refresh();
  };

  if (loading || isAdmin === null) {
    return <AppShell><div className="mt-10 text-center text-sm text-muted-foreground">Loading…</div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell>
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">The Welcome Showcase is managed by the Rizzla team.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="mt-3 text-2xl font-bold">Welcome Showcase</h1>
      <p className="text-sm text-muted-foreground">Videos and photos new users see right after signing up. TikTok-style vertical reel, auto-advance every 10s.</p>

      <div className="mt-5 rounded-3xl border border-border bg-card p-4">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Caption for next upload</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 140))}
          placeholder="e.g. Meet Jen — one of our top hosts"
          className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-primary/5 px-4 py-4 text-sm font-semibold text-primary hover:bg-primary/10">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload image or video"}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onUpload} disabled={busy} />
        </label>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Reel ({rows.length})</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.id} className={`relative overflow-hidden rounded-2xl border ${row.is_active ? "border-border" : "border-dashed border-muted opacity-60"} bg-black`}>
            <div className="aspect-[9/16] w-full bg-muted">
              {row.url ? (
                row.media_type === "video" ? (
                  <video src={row.url} className="h-full w-full object-cover" muted playsInline loop autoPlay />
                ) : (
                  <img src={row.url} alt={row.caption ?? ""} className="h-full w-full object-cover" />
                )
              ) : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <button onClick={() => editCaption(row)} className="line-clamp-2 w-full text-left text-[11px] text-white">
                {row.caption ?? "Add caption…"}
              </button>
            </div>
            <div className="absolute right-1 top-1 flex flex-col gap-1">
              <button onClick={() => toggle(row)} aria-label="Toggle active" className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white">
                {row.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(row)} aria-label="Delete" className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="col-span-2 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nothing uploaded yet. Add a few videos or photos and they'll auto-play for every new user.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
