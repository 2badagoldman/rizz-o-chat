import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Rizz Social" }] }),
  component: Profile,
});

interface ProfileRow {
  display_name: string;
  account_type: "host" | "member";
  verification_status: "pending" | "verified" | "rejected";
  bio: string | null;
  avatar_url: string | null;
}

interface MediaRow {
  id: string;
  storage_path: string;
  media_type: "image" | "video";
  caption: string | null;
  signedUrl?: string;
}

const CAPTION_MAX = 140;

const BIO_MAX = 500;

function Profile() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [bioMsg, setBioMsg] = useState<string | null>(null);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingCaption, setPendingCaption] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, account_type, verification_status, bio, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      setProfile(data as ProfileRow);
      setBio(data.bio ?? "");
      if (data.avatar_url) {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(data.avatar_url, 3600);
        setAvatarSignedUrl(signed?.signedUrl ?? null);
      } else {
        setAvatarSignedUrl(null);
      }
    }
  };

  const loadMedia = async (uid: string) => {
    const { data } = await supabase
      .from("profile_media")
      .select("id, storage_path, media_type, caption")
      .eq("user_id", uid)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!data) return;
    const withUrls = await Promise.all(
      data.map(async (row) => {
        const { data: signed } = await supabase.storage
          .from("profile-media")
          .createSignedUrl(row.storage_path, 3600);
        return { ...(row as MediaRow), signedUrl: signed?.signedUrl };
      })
    );
    setMedia(withUrls);
  };

  useEffect(() => {
    if (!user) return;
    void loadProfile(user.id);
    void loadMedia(user.id);
  }, [user]);

  if (loading)
    return (
      <AppShell>
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );

  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl">You&apos;re not signed in</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const onAvatarPick = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your avatar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be under 5MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      await loadProfile(user.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSaveBio = async () => {
    setSavingBio(true);
    setBioMsg(null);
    setError(null);
    try {
      const trimmed = bio.trim().slice(0, BIO_MAX);
      const { error: err } = await supabase
        .from("profiles")
        .update({ bio: trimmed })
        .eq("id", user.id);
      if (err) throw err;
      setBioMsg("Saved");
      setTimeout(() => setBioMsg(null), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save bio");
    } finally {
      setSavingBio(false);
    }
  };

  const onMediaPick = async (files: FileList) => {
    setError(null);
    setUploadingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) {
          setError(`Skipped ${file.name}: only images and videos allowed.`);
          continue;
        }
        const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxBytes) {
          setError(`Skipped ${file.name}: too large.`);
          continue;
        }
        const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-media")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("profile_media").insert({
          user_id: user.id,
          storage_path: path,
          media_type: isVideo ? "video" : "image",
          caption: pendingCaption.trim().slice(0, CAPTION_MAX) || null,
        });
        if (dbErr) throw dbErr;
      }
      setPendingCaption("");
      await loadMedia(user.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const onSaveCaption = async (row: MediaRow) => {
    const next = editingCaption.trim().slice(0, CAPTION_MAX) || null;
    setEditingId(null);
    const { error: err } = await supabase
      .from("profile_media")
      .update({ caption: next })
      .eq("id", row.id);
    if (err) {
      setError(err.message);
      return;
    }
    setMedia((prev) => prev.map((m) => (m.id === row.id ? { ...m, caption: next } : m)));
  };

  const onDeleteMedia = async (row: MediaRow) => {
    setError(null);
    try {
      await supabase.storage.from("profile-media").remove([row.storage_path]);
      await supabase.from("profile_media").delete().eq("id", row.id);
      setMedia((prev) => prev.filter((m) => m.id !== row.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const avatarSrc = avatarSignedUrl ?? rizzAiLogo.url;

  return (
    <AppShell footerNote={<>Hosts on Rizz Social are compensated partners.</>}>
      <h1 className="pt-6 text-2xl">Profile</h1>

      {/* Identity card */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-glow"
            aria-label="Change profile picture"
          >
            <img src={avatarSrc} alt="Your avatar" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
              {uploadingAvatar ? "…" : "Edit"}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onAvatarPick(f);
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {profile?.display_name || user.email?.split("@")[0]}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {profile?.account_type ?? "member"}
              {profile?.account_type === "host"
                ? ` · ${profile.verification_status}`
                : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="mt-4 w-full rounded-[12px] border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground disabled:opacity-50"
        >
          {uploadingAvatar ? "Uploading…" : "Change profile photo"}
        </button>
      </section>

      {/* About me */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            About you
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          placeholder="Tell everyone a bit about yourself — your vibe, interests, what you're into…"
          rows={5}
          className="mt-3 w-full resize-none rounded-[12px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveBio}
            disabled={savingBio}
            className="btn-brand inline-flex disabled:opacity-50"
          >
            {savingBio ? "Saving…" : "Save"}
          </button>
          {bioMsg ? (
            <span className="text-xs font-medium text-primary">{bioMsg}</span>
          ) : null}
        </div>
      </section>

      {/* Media gallery */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Photos & videos
          </h2>
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            disabled={uploadingMedia}
            className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {uploadingMedia ? "Uploading…" : "+ Upload"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Captions show to everyone — the photo/video only unlocks after they join your Friends List.
        </p>
        <div className="mt-3">
          <input
            type="text"
            value={pendingCaption}
            onChange={(e) => setPendingCaption(e.target.value.slice(0, CAPTION_MAX))}
            placeholder="Caption for your next upload (optional)"
            className="w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {pendingCaption.length}/{CAPTION_MAX}
          </p>
        </div>
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) void onMediaPick(e.target.files);
          }}
        />
        {media.length === 0 ? (
          <p className="mt-4 rounded-[12px] border border-dashed border-border bg-background/60 px-4 py-6 text-center text-xs text-muted-foreground">
            No media yet. Add photos or videos to show off your vibe.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {media.map((row) => (
              <li
                key={row.id}
                className="flex gap-3 rounded-[12px] border border-border bg-background/60 p-2"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-background">
                  {row.media_type === "video" ? (
                    <video src={row.signedUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={row.signedUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  {editingId === row.id ? (
                    <>
                      <textarea
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value.slice(0, CAPTION_MAX))}
                        rows={2}
                        className="w-full resize-none rounded-[10px] border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                        placeholder="Write a caption…"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {editingCaption.length}/{CAPTION_MAX}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-[11px] font-semibold text-muted-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => onSaveCaption(row)}
                            className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-[11px] font-semibold text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="min-h-[36px] whitespace-pre-wrap break-words text-xs text-foreground/90">
                        {row.caption || (
                          <span className="italic text-muted-foreground">No caption yet</span>
                        )}
                      </p>
                      <div className="mt-auto flex items-center justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(row.id);
                            setEditingCaption(row.caption ?? "");
                          }}
                          className="text-[11px] font-semibold text-primary"
                        >
                          {row.caption ? "Edit caption" : "Add caption"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMedia(row)}
                          className="text-[11px] font-semibold text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <div className="mt-4 rounded-[12px] border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        <button
          className="w-full rounded-[14px] border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary"
          onClick={() => {
            try { localStorage.setItem("rizzla:showWelcome", "1"); } catch {}
            window.location.reload();
          }}
        >
          Preview welcome reel
        </button>
        <Link
          to="/subscriptions"
          className="block w-full rounded-[14px] border border-border bg-card px-5 py-3 text-center text-sm font-semibold"
        >
          My subscriptions & billing
        </Link>
        <a
          href="/admin/showcase"
          className="block w-full rounded-[14px] border border-border bg-card px-5 py-3 text-center text-sm font-semibold"
        >
          Manage welcome reel (admin)
        </a>
        <button
          className="w-full rounded-[14px] border border-border bg-card px-5 py-3 text-sm font-semibold"
          onClick={async () => {
            await signOut();
            router.navigate({ to: "/" });
          }}
        >
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
