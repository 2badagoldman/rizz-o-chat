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
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

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
    // Batch-sign in chunks: 45+ parallel single-sign calls get throttled and
    // silently return no URL, which made hidden items render as blank tiles.
    const urls = new Map<string, string>();
    const paths = data.map((r) => r.storage_path);
    for (let i = 0; i < paths.length; i += 25) {
      const chunk = paths.slice(i, i + 25);
      const { data: signed } = await supabase.storage.from("showcase").createSignedUrls(chunk, 3600);
      signed?.forEach((s) => {
        if (s.signedUrl && s.path) urls.set(s.path, s.signedUrl);
      });
    }
    setRows(data.map((r) => ({ ...r, url: urls.get(r.storage_path) }) as Row));
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const uploadOne = async (file: File, indexOffset: number) => {
    if (!user) throw new Error("Not signed in");
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) throw new Error(`${file.name}: not an image or video`);
    const maxMB = isVideo ? 100 : 15;
    if (file.size > maxMB * 1024 * 1024) throw new Error(`${file.name}: exceeds ${maxMB}MB`);
    const { reviewImageBeforeUpload, MODERATION_BLOCK_MESSAGE } = await import("@/lib/media-moderation");
    const verdict = await reviewImageBeforeUpload(file);
    if (!verdict.allow) throw new Error(`${file.name}: ${MODERATION_BLOCK_MESSAGE}`);
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
      sort_order: rows.length + indexOffset,
      is_active: true,
    });
    if (insErr) throw insErr;
  };

  const uploadFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;
    setError(null); setBusy(true);
    setProgress({ done: 0, total: files.length });
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadOne(files[i], i);
      } catch (err: unknown) {
        errors.push(err instanceof Error ? err.message : "Upload failed");
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setCaption("");
    await refresh();
    setBusy(false);
    setProgress(null);
    if (errors.length) setError(errors.join(" · "));
  };

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) await uploadFiles(files);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    const files = Array.from(e.dataTransfer.files ?? []).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (files.length) await uploadFiles(files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!busy) setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
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
          <p className="mt-2 text-sm text-muted-foreground">The Welcome Showcase is managed by the Crush team.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="mt-3 text-2xl font-bold">Welcome Showcase</h1>
      <p className="text-sm text-muted-foreground">Videos and photos new users see right after signing up. TikTok-style vertical reel, auto-advance every 10s.</p>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragEnd={onDragLeave}
        className={`mt-5 rounded-3xl border bg-card p-4 transition-all ${dragOver ? "border-primary ring-4 ring-primary/20 scale-[1.01]" : "border-border"}`}
      >
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Caption for next upload{progress ? " (applies to all)" : ""}</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 140))}
          placeholder="e.g. Meet Jen — one of our top hosts"
          className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
        />
        <label className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-8 text-sm font-semibold transition-colors ${dragOver ? "border-primary bg-primary/10 text-primary" : "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"}`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span>
            {busy
              ? progress ? `Uploading ${progress.done}/${progress.total}…` : "Uploading…"
              : dragOver ? "Drop to upload" : "Drag & drop or click to upload"}
          </span>
          {!busy && <span className="text-[11px] font-normal text-muted-foreground">Images (up to 15MB) or videos (up to 100MB) · multiple files supported</span>}
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFileInput} disabled={busy} />
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
                  <img loading="lazy" decoding="async" src={row.url} alt={row.caption ?? ""} className="h-full w-full object-cover" />
                )
              ) : (
                <div className="grid h-full w-full place-items-center px-2 text-center text-[10px] text-muted-foreground">
                  Preview unavailable
                </div>
              )}
            </div>
            {!row.is_active ? (
              <span className="absolute left-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                Hidden from app
              </span>
            ) : null}
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
