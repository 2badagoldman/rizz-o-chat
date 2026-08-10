import { useEffect, useMemo, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getShowcaseReel, type ReelItem } from "@/lib/showcase-brain.functions";
import { useShuffled } from "@/hooks/useShuffled";
import crushLogo from "@/assets/rizz-ai-logo.webp.asset.json";


/**
 * Showcase grid — the best-performing showcase photos, reshuffled on a timer
 * so the section feels fresh (same rotation as the host cards elsewhere).
 * Rendered on Home and Discover. Tap any tile to open it full-screen.
 */
export function ShowcaseRail({
  title = "Showcase",
  subtitle = "Fresh looks from our creators",
  limit = 25,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
}) {
  const [allItems, setAllItems] = useState<ReelItem[]>([]);
  const [broken, setBroken] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getShowcaseReel({ data: { limit } })
      .then((reel) => {
        if (alive && reel) setAllItems(reel.filter((r) => r.url));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [limit]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  // Media whose signed URL failed is dropped entirely — otherwise the tile
  // collapses to raw alt text, which is what made the rail look broken.
  const usable = useMemo(
    () => allItems.filter((i) => !broken.includes(i.id)),
    [allItems, broken],
  );
  // Reshuffle every 15s so returning visitors see a different set first.
  const items = useShuffled(usable, 15_000);
  const markBroken = (id: string) =>
    setBroken((prev) => (prev.includes(id) ? prev : [...prev, id]));

  if (items.length === 0) return null;

  // Keyed by id, not index, so a reshuffle never swaps the open photo.
  const active = openId ? items.find((i) => i.id === openId) ?? null : null;


  return (
    <section className="mt-7 rise-in">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-display font-bold">
          <img loading="lazy" decoding="async" src={crushLogo.url} alt="" className="h-4 w-4 rounded-full" />
          {title}
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpenId(it.id)}
            aria-label={it.caption ? `Open showcase photo: ${it.caption}` : "Open showcase photo"}
            className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border/60 shadow-card transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ animation: `rise-in 600ms ${Math.min(i, 10) * 45}ms cubic-bezier(.2,.8,.2,1) both` }}
          >
            {it.media_type === "video" ? (
              <video
                src={it.url}
                muted
                loop
                playsInline
                autoPlay
                onError={() => markBroken(it.id)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img
                src={it.url}
                alt=""
                loading={i < 6 ? "eager" : "lazy"}
                decoding="async"
                onError={() => markBroken(it.id)}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
            {it.caption ? (
              <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-left text-[11px] font-semibold leading-snug text-white">
                {it.caption}
              </p>
            ) : null}
          </button>
        ))}
      </div>


      {active ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenId(null)}
        >
          <button
            type="button"
            onClick={() => setOpenId(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <figure
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-neutral-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 flex-1 bg-black">
              {active.media_type === "video" ? (
                <video
                  src={active.url}
                  controls
                  autoPlay
                  playsInline
                  className="h-full max-h-full w-full object-contain"
                />
              ) : (
                <img loading="lazy" decoding="async"
                  src={active.url}
                  alt={active.caption ?? "Showcase"}
                  className="h-full max-h-full w-full object-contain"
                />
              )}
            </div>
            <figcaption className="shrink-0 space-y-2.5 bg-neutral-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center">
              {active.caption ? (
                <p className="line-clamp-2 text-sm font-semibold text-white">{active.caption}</p>
              ) : null}
              <Link
                to="/upgrade"
                onClick={() => setOpenId(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-glow transition active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Subscribe to chat with her
              </Link>
              <p className="text-[11px] text-white/70">
                Crush Gold unlocks Friends Lists and direct chat with showcase hosts.
              </p>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </section>
  );
}
