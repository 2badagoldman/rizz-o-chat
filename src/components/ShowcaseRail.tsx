import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { getShowcaseReel, type ReelItem } from "@/lib/showcase-brain.functions";

/**
 * Showcase rail — a horizontally scrolling strip of the best-performing
 * showcase photos. Rendered on Home and Discover so the gallery isn't
 * locked behind the welcome popup. Tap any tile to open it full-screen.
 */
export function ShowcaseRail({
  title = "Showcase",
  subtitle = "Fresh looks from our hosts",
  limit = 20,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<ReelItem[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getShowcaseReel({ data: { limit } })
      .then((reel) => {
        if (alive && reel) setItems(reel.filter((r) => r.url));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [limit]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (items.length === 0) return null;

  const active = open !== null ? items[open] : null;

  return (
    <section className="mt-7 rise-in">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-display font-bold">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {title}
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </span>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={it.caption ? `Open showcase photo: ${it.caption}` : "Open showcase photo"}
            className="group relative h-56 w-40 shrink-0 snap-start overflow-hidden rounded-3xl border border-border/60 shadow-card transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ animation: `rise-in 600ms ${Math.min(i, 10) * 45}ms cubic-bezier(.2,.8,.2,1) both` }}
          >
            {it.media_type === "video" ? (
              <video
                src={it.url}
                muted
                loop
                playsInline
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img
                src={it.url}
                alt={it.caption ?? "Showcase"}
                loading={i < 3 ? "eager" : "lazy"}
                decoding="async"
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
          className="fixed inset-0 z-[95] grid place-items-center bg-black/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
            {active.media_type === "video" ? (
              <video src={active.url} controls autoPlay playsInline className="max-h-[75vh] w-full object-contain" />
            ) : (
              <img src={active.url} alt={active.caption ?? "Showcase"} className="max-h-[75vh] w-full object-contain" />
            )}
            {active.caption ? (
              <figcaption className="bg-black/60 px-4 py-3 text-center text-sm font-semibold text-white">
                {active.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </section>
  );
}
