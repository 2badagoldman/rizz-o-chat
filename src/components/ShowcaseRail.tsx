import { useMemo, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import type { ReelItem } from "@/lib/showcase-brain.functions";
import { creatorById } from "@/lib/creator-identity";
import { localHostPortrait } from "@/lib/host-avatars";
import { useShuffled } from "@/hooks/useShuffled";
import crushLogo from "@/assets/crush-logo.png.asset.json";

const rootApi = getRouteApi("__root__");

/**
 * Showcase grid — the best-performing showcase photos, reshuffled on a timer
 * so the section feels fresh. Every tile is owned by exactly one creator (the
 * Creator Identity Manager decides on the server) and tapping it opens HER
 * profile, which renders this same photo as her hero.
 *
 * Reads the root loader payload (the same one that seeds creator identities)
 * so the tile URL and the profile hero URL are byte-identical — no refetch.
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
  const seed = rootApi.useLoaderData() as { reel?: ReelItem[] } | undefined;
  const data = seed?.reel;
  const [broken, setBroken] = useState<string[]>([]);

  // Media whose signed URL failed is dropped entirely — otherwise the tile
  // collapses to raw alt text, which is what made the rail look broken.
  const usable = useMemo(
    () => (data ?? []).filter((i) => i.url && i.hostId && !broken.includes(i.id)).slice(0, limit),
    [data, broken, limit],
  );
  // Reshuffle so returning visitors see a different set first. Ownership is
  // fixed per photo, so the order never changes who a tile opens.
  const items = useShuffled(usable, 45_000);
  const markBroken = (id: string) =>
    setBroken((prev) => (prev.includes(id) ? prev : [...prev, id]));

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-display font-bold">{title}</h2>
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <img
            loading="lazy"
            decoding="async"
            src={crushLogo.url}
            alt=""
            className="h-4 w-4 rounded-full"
          />
          Tap to open her profile
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => {
          const creator = creatorById(it.hostId);
          const hostId = it.hostId as string;
          return (
            <Link
              key={it.id}
              to="/host/$hostId"
              params={{ hostId }}
              aria-label={creator ? `Open ${creator.name}'s profile` : "Open creator profile"}
              className="group relative block aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border/60 shadow-card transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                animation: `rise-in 600ms ${Math.min(i, 10) * 45}ms cubic-bezier(.2,.8,.2,1) both`,
              }}
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
                  onError={(e) => {
                    // Expired signed link → keep the tile on the same creator's bundled portrait.
                    const local = localHostPortrait(hostId);
                    if (local && !e.currentTarget.src.endsWith(local)) e.currentTarget.src = local;
                    else markBroken(it.id);
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-2 bottom-2 text-left text-white">
                {creator ? (
                  <p className="flex items-center gap-1 text-[13px] font-display font-bold leading-tight">
                    {creator.name}, {creator.age}
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </p>
                ) : null}
                {it.caption ? (
                  <p className="line-clamp-2 text-[11px] font-medium leading-snug text-white/85">
                    {it.caption}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
