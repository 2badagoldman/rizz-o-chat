import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Eye, Gift, ImagePlus, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/lib/auth";
import {
  createStory,
  deleteStory,
  listStories,
  listStoryViewers,
  markStoryViewed,
  replyToStory,
  signStoryMedia,
} from "@/lib/stories.functions";
import {
  MAX_STORY_BYTES,
  STORY_ACCENTS,
  STORY_MEDIA_BUCKET,
  accentCss,
  storyKindForFile,
  storyMediaPath,
  timeAgo,
  type StoryGroup,
  type StoryKind,
  type StoryRow,
} from "@/lib/stories";
import { buildDemoStoryGroups, isDemoStoryId, shuffleGroups } from "@/lib/demo-stories";


/** Instagram-style story rail: tap a ring to watch, reply, or see your viewers. */
export function StoryRail() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchStories = useServerFn(listStories);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [demo, setDemo] = useState<StoryGroup[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
    enabled: !!user,
    staleTime: 30_000,
  });

  // Shuffle the AI co-host stories once per browser session so the rail feels
  // alive on every visit but stays stable while the user browses.
  useEffect(() => {
    const key = "crush.story-order";
    const base = buildDemoStoryGroups();
    let saved: string[] | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    } catch {
      saved = null;
    }
    let arranged: StoryGroup[];
    if (Array.isArray(saved) && saved.length) {
      const byId = new Map(base.map((g) => [g.author_id, g]));
      arranged = saved.map((id) => byId.get(id)).filter(Boolean) as StoryGroup[];
      for (const g of base) if (!arranged.some((a) => a.author_id === g.author_id)) arranged.push(g);
    } else {
      arranged = shuffleGroups(base);
      try {
        sessionStorage.setItem(key, JSON.stringify(arranged.map((g) => g.author_id)));
      } catch {
        /* private mode — fine */
      }
    }
    setDemo(arranged);
  }, []);

  if (!user) return null;

  const mine = groups.find((g) => g.author_id === user.id);
  const others = groups.filter((g) => g.author_id !== user.id);
  const ordered: StoryGroup[] = mine ? [mine, ...others, ...demo] : [...others, ...demo];


  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Stories</h2>
        <span className="text-[11px] text-muted-foreground">Disappears in 24h</span>
      </div>
      <div className="lux-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="press-spring flex w-[74px] shrink-0 flex-col items-center gap-1.5"
        >
          <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-dashed border-primary/60 bg-card/60 text-primary">
            <Plus className="h-6 w-6" />
          </span>
          <span className="truncate text-[11px] font-semibold text-muted-foreground">Your story</span>
        </button>

        {ordered.map((g, i) => (
          <button
            key={g.author_id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="press-spring flex w-[74px] shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={`grid h-[68px] w-[68px] place-items-center rounded-full p-[3px] ${
                g.allSeen ? "bg-border" : "bg-gradient-brand"
              }`}
            >
              <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-background p-[2px]">
                {g.avatar_url ? (
                  <img
                    loading="lazy"
                    decoding="async"
                    src={g.avatar_url}
                    alt={g.display_name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center rounded-full bg-muted text-sm font-bold">
                    {g.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] font-semibold">
              {g.author_id === user.id ? "You" : g.display_name}
            </span>
          </button>
        ))}
      </div>

      {composing ? (
        <StoryComposer
          onClose={() => setComposing(false)}
          onPosted={() => {
            setComposing(false);
            qc.invalidateQueries({ queryKey: ["stories"] });
          }}
        />
      ) : null}

      {openIndex != null && ordered[openIndex] ? (
        <StoryViewer
          groups={ordered}
          startIndex={openIndex}
          meId={user.id}
          onClose={() => {
            setOpenIndex(null);
            qc.invalidateQueries({ queryKey: ["stories"] });
          }}
        />
      ) : null}
    </section>
  );
}

/* ------------------------------- composer ------------------------------- */

function StoryComposer({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const post = useServerFn(createStory);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [kind, setKind] = useState<StoryKind>("media");
  const [caption, setCaption] = useState("");
  const [accent, setAccent] = useState<string>(STORY_ACCENTS[0].id);
  const [coins, setCoins] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async () => {
    setBusy(true);
    try {
      let mediaPath: string | null = null;
      let mediaType: string | null = null;
      if (kind === "media") {
        if (!file) throw new Error("Pick a photo or video first.");
        const mk = storyKindForFile(file);
        if (!mk) throw new Error("Only photos and videos can be posted.");
        if (file.size > MAX_STORY_BYTES) throw new Error("File is too large (50 MB max).");
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) throw new Error("Sign in to post a story.");
        mediaPath = storyMediaPath(uid, file);
        mediaType = mk;
        const { error } = await supabase.storage
          .from(STORY_MEDIA_BUCKET)
          .upload(mediaPath, file, { contentType: file.type, upsert: false });
        if (error) throw error;
      }
      await post({
        data: {
          kind,
          mediaPath,
          mediaType,
          caption,
          accent,
          coinValue: kind === "coins" ? Number(coins) || 0 : null,
        },
      });
      toast.success("Story posted — live for 24 hours");
      onPosted();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay className="fixed inset-0 z-[9998] grid place-items-end bg-black/70 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">New story</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {(
            [
              { id: "media", label: "Photo", icon: ImagePlus },
              { id: "gift", label: "Gift", icon: Gift },
              { id: "coins", label: "Coins", icon: Coins },
              { id: "text", label: "Text", icon: Send },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setKind(t.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-[11px] font-semibold transition-colors ${
                kind === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {kind === "media" ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 grid h-56 w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground"
            >
              {preview ? (
                file?.type.startsWith("video/") ? (
                  <video src={preview} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                )
              ) : (
                "Tap to pick a photo or video"
              )}
            </button>
          </>
        ) : (
          <div
            className="mt-4 grid h-56 w-full place-items-center rounded-2xl p-6 text-center text-lg font-bold text-white"
            style={{ background: accentCss(accent) }}
          >
            {kind === "coins"
              ? `${coins || 0} coins ${caption ? `· ${caption}` : ""}`
              : caption || (kind === "gift" ? "Gift highlight" : "Say something")}
          </div>
        )}

        {kind !== "media" ? (
          <div className="mt-3 flex gap-2">
            {STORY_ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-label={a.label}
                onClick={() => setAccent(a.id)}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card ${accent === a.id ? "ring-2 ring-primary" : ""}`}
                style={{ background: a.css }}
              />
            ))}
          </div>
        ) : null}

        {kind === "coins" ? (
          <input
            value={coins}
            onChange={(e) => setCoins(e.target.value.replace(/\D/g, "").slice(0, 7))}
            inputMode="numeric"
            placeholder="Coins to highlight"
            className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
          />
        ) : null}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 280))}
          rows={2}
          placeholder={kind === "media" ? "Add a caption…" : "What do you want to say?"}
          className="mt-3 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm"
        />

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="btn-brand mt-4 w-full justify-center disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share to story"}
        </button>
      </div>
    </Overlay>
  );
}

/** Renders story overlays into <body> so page stacking contexts can't cover them. */
function Overlay({ className, children }: { className: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<div className={className}>{children}</div>, document.body);
}

/* -------------------------------- viewer -------------------------------- */

/** Demo co-hosts live at /host/:id, real members at /u/:id. */
function profileLink(authorId: string) {
  return authorId.startsWith("demo-")
    ? ({ to: "/host/$hostId", params: { hostId: authorId } } as const)
    : ({ to: "/u/$userId", params: { userId: authorId } } as const);
}





function StoryViewer({
  groups,
  startIndex,
  meId,
  onClose,
}: {
  groups: StoryGroup[];
  startIndex: number;
  meId: string;
  onClose: () => void;
}) {
  const [gi, setGi] = useState(startIndex);
  const [si, setSi] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [reply, setReply] = useState("");

  const seen = useServerFn(markStoryViewed);
  const send = useServerFn(replyToStory);
  const remove = useServerFn(deleteStory);

  const group = groups[gi];
  const story = group?.stories[si];
  const isMine = group?.author_id === meId;

  const next = useCallback(() => {
    setShowViewers(false);
    setReply("");
    if (!group) return onClose();
    if (si + 1 < group.stories.length) return setSi(si + 1);
    if (gi + 1 < groups.length) {
      setGi(gi + 1);
      return setSi(0);
    }
    onClose();
  }, [gi, si, group, groups.length, onClose]);

  const prev = () => {
    setShowViewers(false);
    if (si > 0) return setSi(si - 1);
    if (gi > 0) {
      setGi(gi - 1);
      setSi(0);
    }
  };

  useEffect(() => {
    if (!story || isDemoStoryId(story.id)) return;
    seen({ data: { id: story.id } }).catch(() => {});
  }, [story, seen]);

  useEffect(() => {
    if (showViewers || !story) return;
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [story, showViewers, next]);

  const replyMut = useMutation({
    mutationFn: async () => {
      if (isDemoStoryId(story!.id)) return { ok: true };
      return send({ data: { id: story!.id, body: reply } });
    },
    onSuccess: () => {
      setReply("");
      toast.success("Reply sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  if (!story) return null;

  return (
    <Overlay className="fixed inset-0 z-[9999] bg-black">
      {/* Media fills the entire viewport so it never gets squeezed by headers/footers */}
      <div className="absolute inset-0">
        <StoryCanvas story={story} fitScreen />
      </div>

      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 px-3 pt-3">
        {group.stories.map((s, i) => (
          <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span className={`block h-full bg-white ${i < si ? "w-full" : i === si ? "w-1/2" : "w-0"}`} />
          </span>
        ))}
      </div>

      {/* Header — tapping the avatar/name opens that person's page (IG style) */}
      <div className="absolute left-0 right-0 top-10 z-20 flex items-center gap-3 px-4 py-3 text-white">
        <Link
          {...profileLink(group.author_id)}
          onClick={onClose}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          {group.avatar_url ? (
            <img src={group.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-bold">
              {group.display_name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{isMine ? "Your story" : group.display_name}</p>
            <p className="text-[11px] text-white/60">{timeAgo(story.created_at)} ago</p>
          </div>
        </Link>

        {isMine ? (
          <button
            type="button"
            aria-label="Delete story"
            onClick={async () => {
              await remove({ data: { id: story.id } }).catch(() => {});
              toast.success("Story deleted");
              onClose();
            }}
            className="rounded-full p-2 text-white/80 hover:bg-white/10"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        ) : null}
        <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 hover:bg-white/10">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Tap zones for prev/next — kept below the chrome so buttons stay clickable */}
      <button type="button" aria-label="Previous" onClick={prev} className="absolute inset-y-0 left-0 z-[1] w-1/3" />
      <button type="button" aria-label="Next" onClick={next} className="absolute inset-y-0 right-0 z-[1] w-1/3" />

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 space-y-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8">
        {story.caption && story.kind === "media" ? (
          <p className="text-center text-sm text-white/90">{story.caption}</p>
        ) : null}

        {isMine ? (
          <button
            type="button"
            onClick={() => setShowViewers(true)}
            className="mx-auto flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"
          >
            <Eye className="h-4 w-4" />
            {story.view_count} {story.view_count === 1 ? "view" : "views"}
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reply.trim()) replyMut.mutate();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value.slice(0, 500))}
              placeholder={`Reply to ${group.display_name}…`}
              className="flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50"
            />
            <button
              type="submit"
              disabled={replyMut.isPending || !reply.trim()}
              aria-label="Send reply"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-black disabled:opacity-50"
            >
              {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>

      {showViewers ? <ViewersSheet storyId={story.id} onClose={() => setShowViewers(false)} /> : null}
    </Overlay>
  );
}

function StoryCanvas({ story, fitScreen }: { story: StoryRow; fitScreen?: boolean }) {
  const sign = useServerFn(signStoryMedia);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const path = story.media_path;
    if (!path) return;
    // Demo co-host stories point straight at a bundled portrait URL.
    if (path.startsWith("http") || path.startsWith("/")) {
      setUrl(path);
      return;
    }
    sign({ data: { path } })
      .then((r) => !stop && setUrl(r.url))
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [story.media_path, sign]);

  const mediaWrap = fitScreen
    ? "grid h-full w-full place-items-center"
    : "grid h-full w-full place-items-center";

  if (story.kind !== "media") {
    return (
      <div
        className="grid h-full w-full place-items-center p-8 text-center"
        style={{ background: accentCss(story.accent) }}
      >
        <div className="text-white">
          {story.kind === "coins" ? (
            <p className="font-display text-4xl font-extrabold">{story.coin_value ?? 0} coins</p>
          ) : story.kind === "gift" ? (
            <Gift className="mx-auto mb-3 h-12 w-12" />
          ) : null}
          {story.caption ? <p className="mt-2 text-xl font-semibold">{story.caption}</p> : null}
        </div>
      </div>
    );
  }

  if (!url) {
    return <div className="h-full w-full animate-pulse bg-white/10" />;
  }
  return (
    <div className={mediaWrap}>
      {story.media_type === "video" ? (
        <video
          src={url}
          autoPlay
          muted
          playsInline
          loop
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <img
          src={url}
          alt={story.caption ?? "Story"}
          className="max-h-full max-w-full object-contain"
        />
      )}
    </div>
  );
}

function ViewersSheet({ storyId, onClose }: { storyId: string; onClose: () => void }) {
  const load = useServerFn(listStoryViewers);
  const { data, isLoading } = useQuery({
    queryKey: ["story-viewers", storyId],
    queryFn: () => load({ data: { id: storyId } }),
  });
  const viewers = data?.viewers ?? [];
  const replies = useMemo(() => data?.replies ?? [], [data]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[70vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Viewers</h3>
          <button type="button" onClick={onClose} aria-label="Close viewers" className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : viewers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No views yet — give it a minute.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {viewers.map((v) => (
              <li key={v.id} className="flex items-center gap-3">
                {v.avatar_url ? (
                  <img src={v.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold">
                    {v.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="flex-1 truncate text-sm font-medium">{v.display_name}</span>
                <span className="text-[11px] text-muted-foreground">{timeAgo(v.created_at)}</span>
              </li>
            ))}
          </ul>
        )}

        {replies.length ? (
          <>
            <h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Replies</h4>
            <ul className="mt-2 space-y-2">
              {replies.map((r) => (
                <li key={r.id} className="rounded-2xl bg-muted/60 px-3 py-2 text-sm">
                  <span className="font-semibold">{r.display_name}: </span>
                  {r.body}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
