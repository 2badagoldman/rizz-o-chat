import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { deleteMyAccount } from "@/lib/account.functions";
import { useServerFn } from "@tanstack/react-start";
import { BlockedAccounts } from "@/components/BlockedAccounts";
import { PushNotificationsCard } from "@/components/PushNotificationsCard";
import { LiveAlertsCard } from "@/components/LiveAlertsCard";
import { useNativePlatform } from "@/hooks/useNative";
import { captureNativePhoto } from "@/lib/native";
import { Camera } from "lucide-react";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { reviewImageBeforeUpload, MODERATION_BLOCK_MESSAGE } from "@/lib/media-moderation";
import { SignedOutGate } from "@/components/SignedOutGate";
import { useQueryClient } from "@tanstack/react-query";




export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Profile — Crush" }] }),
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
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const runDeleteAccount = useServerFn(deleteMyAccount);
  const isNative = useNativePlatform() !== "web";
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
      <SignedOutGate
        title="You're not signed in"
        description="Sign in to set up your photo, bio and media — that's what people see first."
      />
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
      const verdict = await reviewImageBeforeUpload(file);
      if (!verdict.allow) {
        setError(`${MODERATION_BLOCK_MESSAGE} (${verdict.reason})`);
        return;
      }
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["story-me", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["stories"] }),
        queryClient.invalidateQueries({ queryKey: ["public-profile", user.id] }),
      ]);
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

  const onMediaPick = async (files: FileList | File[]) => {
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
        const verdict = await reviewImageBeforeUpload(file);
        if (!verdict.allow) {
          setError(`Skipped ${file.name}: ${MODERATION_BLOCK_MESSAGE}`);
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
    <AppShell footerNote={<>Creators on Crush are compensated partners.</>}>
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
            <img loading="lazy" decoding="async" src={avatarSrc} alt="Your avatar" className="h-full w-full object-cover" />
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
              {profile?.account_type === "host" ? "creator" : "member"}
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
        {isNative ? (
          <button
            type="button"
            onClick={async () => {
              const f = await captureNativePhoto("camera");
              if (f) void onAvatarPick(f);
            }}
            disabled={uploadingAvatar}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground disabled:opacity-50"
          >
            <Camera className="h-4 w-4" /> Take a photo
          </button>
        ) : null}
      </section>

      <PushNotificationsCard />
      <LiveAlertsCard />


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
          <div className="flex items-center gap-2">
            {isNative ? (
              <button
                type="button"
                onClick={async () => {
                  const f = await captureNativePhoto("camera");
                  if (f) void onMediaPick([f]);
                }}
                disabled={uploadingMedia}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" /> Camera
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
              className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {uploadingMedia ? "Uploading…" : "+ Upload"}
            </button>
          </div>
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
                    <img loading="lazy" decoding="async" src={row.signedUrl} alt="" className="h-full w-full object-cover" />
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

      <SubscriptionStatusCard />

      <div className="mt-6 space-y-2">
        {isAdmin ? (
          <button
            className="w-full rounded-[14px] border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary"
            onClick={() => {
              try { localStorage.setItem("rizzla:showWelcome", "1"); } catch {}
              window.location.reload();
            }}
          >
            Preview welcome reel (admin)
          </button>
        ) : null}
        <Link
          to="/subscriptions"
          className="block w-full rounded-[14px] border border-border bg-card px-5 py-3 text-center text-sm font-semibold"
        >
          My subscriptions & billing
        </Link>
        {isAdmin ? (
          <a
            href="/admin/showcase"
            className="block w-full rounded-[14px] border border-border bg-card px-5 py-3 text-center text-sm font-semibold"
          >
            Manage welcome reel (admin)
          </a>
        ) : null}

        <button
          className="w-full rounded-[14px] border border-border bg-card px-5 py-3 text-sm font-semibold"
          onClick={async () => {
            await signOut();
            router.navigate({ to: "/" });
          }}
        >
          Sign out
        </button>

        {deleteOpen ? (
          <div className="rounded-[14px] border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-bold text-destructive">Delete your account</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              This permanently removes your profile, photos, videos, chats and memberships. Active
              subscriptions are cancelled. This cannot be undone. Type <b>DELETE</b> to confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="mt-3 w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-[12px] border border-border bg-card px-4 py-2 text-sm font-semibold"
                onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                className="flex-1 rounded-[12px] bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={async () => {
                  setDeleting(true);
                  setError(null);
                  try {
                    await runDeleteAccount({ data: { confirm: deleteConfirm } });
                    await signOut();
                    window.location.assign("/");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not delete account");
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full rounded-[14px] border border-destructive/40 bg-transparent px-5 py-3 text-sm font-semibold text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete my account
          </button>
        )}

        <BlockedAccounts />

        <section className="rounded-2xl border border-border bg-card/70 p-4">
          <h2 className="text-sm font-bold">Legal</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Review the agreement and privacy practices that govern your account.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/legal/terms"
              className="rounded-xl border border-border bg-background/70 px-3 py-2 text-[12.5px] font-semibold transition hover:border-primary/50 hover:text-primary"
            >
              Terms of Service
            </Link>
            <Link
              to="/legal/privacy"
              className="rounded-xl border border-border bg-background/70 px-3 py-2 text-[12.5px] font-semibold transition hover:border-primary/50 hover:text-primary"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
      </div>

    </AppShell>
  );
}
