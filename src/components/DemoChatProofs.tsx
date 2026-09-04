import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import type { DemoProof } from "@/lib/demo-proofs.functions";
import { demoProofsQueryOptions } from "@/lib/demo-proofs.query";
import { DEMO_HOSTS, AI_HOST_IDS } from "@/lib/demo-hosts";
import { getRouteApi } from "@tanstack/react-router";
import { pinShowcaseAvatar } from "@/lib/showcase-avatar-store";
import { localHostPortrait } from "@/lib/host-avatars";

const rootApi = getRouteApi("__root__");

/** Runway data comes from the root loader so SSR and hydration always agree. */
function useRootProofs(): DemoProof[] {
  const data = rootApi.useLoaderData() as DemoProof[] | undefined;
  return Array.isArray(data) ? data : [];
}

/** Placeholder that occupies the runway's exact footprint before data lands. */
function RunwaySkeleton({ title }: { title: string }) {
  return (
    <section className="mt-4" aria-hidden>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-display font-bold">{title}</h2>
      </div>
      <div className="-mx-3 md:-mx-6 mt-2 flex gap-3 overflow-hidden px-3 md:px-6 pb-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="aspect-[3/4] w-full animate-pulse bg-muted" />
            <div className="space-y-1.5 p-2">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const CARD_W = 260; // px
const GAP = 12; // px (gap-3)
const SECONDS_PER_CARD = 4;

/**
 * Every proof card must open a real, chattable creator. Match the marketing
 * persona to a live demo creator by name; anything unmatched falls back to an
 * AI-powered creator so the visitor still gets their free chats.
 */
function hostIdForProof(proof: DemoProof, index: number): string {
  if (DEMO_HOSTS.some((host) => host.id === proof.hostId)) return proof.hostId;
  const match = DEMO_HOSTS.find((host) => host.name.toLowerCase() === proof.name.toLowerCase());
  return match?.id ?? AI_HOST_IDS[index % AI_HOST_IDS.length]!;
}

/**
 * Mix the two photo pools on the scroll: the original showcase shoot (signed
 * URLs from the server loader) alternates with the bundled AI portraits. The
 * bundled portrait is the fallback whenever a showcase URL is missing or
 * fails, so a card can never render black again.
 */
function proofImage(proof: DemoProof, hostId: string, index: number): string {
  const local = localHostPortrait(hostId);
  const showcase = /^https?:\/\//i.test(proof.image) ? proof.image : "";
  if (showcase && index % 2 === 0) return showcase;
  return local || showcase;
}

/** If a signed showcase URL expired mid-session, swap in the bundled portrait. */
function fallbackToLocal(e: React.SyntheticEvent<HTMLImageElement>, hostId: string) {
  const local = localHostPortrait(hostId);
  if (local && !e.currentTarget.src.endsWith(local)) e.currentTarget.src = local;
}

/**
 * Proof-of-concept screenshots: a large creator photo with her name and a real
 * 4-message exchange with a member. Used on the marketing home page and in the
 * admin demo workflow.
 */
export function DemoChatProofs({
  limit = 6,
  title = "Real conversations, real replies",
  subtitle = "Actual chats between members and Crush creators",
  showCta = true,
  variant = "grid",
  lineLimit,
}: {
  limit?: number;
  title?: string;
  subtitle?: string;
  showCta?: boolean;
  /** "rail" renders a slow auto-scrolling runway that fits above the fold. */
  variant?: "grid" | "rail";
  lineLimit?: number;
}) {
  // The rail uses the root loader payload (serialized with the SSR HTML) so it
  // hydrates with the page; other variants fetch through Query.
  const rootProofs = useRootProofs();
  const query = useQuery({ ...demoProofsQueryOptions(limit), enabled: variant !== "rail" });
  const proofs = variant === "rail" ? rootProofs : (query.data ?? []);
  const isPending = variant === "rail" ? false : query.isPending;

  // Runway faces now come from bundled portraits, so there is nothing remote
  // to register — every surface resolves the same offline image by host id.

  if (variant === "rail") {
    // Jen's card uses the brand silhouette, not a person — keep the runway all faces.
    const rail = proofs.filter((p) => p.name.toLowerCase() !== "jen");
    if (rail.length === 0) {
      // Reserve the runway's space while data is in flight so nothing jumps.
      return isPending ? <RunwaySkeleton title={title} /> : null;
    }
    return <ProofRunway proofs={rail} title={title} showCta={showCta} lineLimit={lineLimit ?? 2} />;
  }

  if (proofs.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {proofs.map((p, pIdx) => {
          const hostId = hostIdForProof(p, pIdx);
          const image = proofImage(p, hostId, pIdx);
          return (
          <article
            key={p.id}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
              <img
                src={image}
                alt={`${p.name} creator preview`}
                loading="lazy"
                decoding="async"
                onError={(e) => fallbackToLocal(e, hostId)}
                className="h-full w-full object-cover transition-opacity duration-500"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4">
                <p className="flex items-center gap-1.5 text-lg font-display font-bold text-white">
                  {p.name}, {p.age}
                  <BadgeCheck className="h-4 w-4 text-primary" />
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
                  {p.tagline}
                </p>
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                Online
              </span>
            </div>

            <div className="space-y-2 p-4">
              {p.lines.map((l, i) => (
                <div
                  key={i}
                  className={`flex ${l.from === "member" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
                      l.from === "member"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-muted/60 text-foreground"
                    }`}
                  >
                    {l.text}
                  </p>
                </div>
              ))}
              {showCta ? (
                <Link
                  to="/chat/$hostId"
                  params={{ hostId }}
                  onClick={() => pinShowcaseAvatar(hostId, image)}
                  className="mt-3 block rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground"
                >
                  Message {p.name} free
                </Link>
              ) : null}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Slow left-to-right runway of full creator photos. Each creator gets roughly
 * four seconds on screen; users can still swipe back to one that scrolled past.
 */
function ProofRunway({
  proofs,
  title,
  showCta,
  lineLimit,
}: {
  proofs: DemoProof[];
  title: string;
  showCta: boolean;
  lineLimit: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const loop = [...proofs, ...proofs];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const speed = (CARD_W + GAP) / SECONDS_PER_CARD; // px per second
    let raf = 0;
    let last = performance.now();
    const half = () => el.scrollWidth / 2;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      el.scrollLeft += speed * dt;
      if (el.scrollLeft >= half()) el.scrollLeft -= half();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, proofs.length]);

  // Resume shortly after the user stops interacting.
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdPause = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 2500);
  };
  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 truncate text-sm font-display font-bold">{title}</h2>
        <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline">
          Swipe to go back
        </span>
      </div>
      <div
        ref={ref}
        onPointerEnter={holdPause}
        onPointerLeave={scheduleResume}
        onPointerDown={holdPause}
        onPointerUp={scheduleResume}
        onTouchStart={holdPause}
        onTouchEnd={scheduleResume}
        onWheel={() => {
          holdPause();
          scheduleResume();
        }}
        className="-mx-3 md:-mx-6 mt-2 flex gap-3 overflow-x-auto px-3 md:px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loop.map((p, idx) => {
          const hostId = hostIdForProof(p, idx % proofs.length);
          const image = proofImage(p, hostId, idx % proofs.length);
          return (
          <Link
            key={`${p.id}-${idx}`}
            to="/host/$hostId"
            params={{ hostId }}
            onClick={() => pinShowcaseAvatar(hostId, image)}
            aria-label={`Open ${p.name}'s profile and chat`}
            className="block w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
              <img
                src={image}
                alt={`${p.name} creator preview`}
                loading={idx < 5 ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => fallbackToLocal(e, hostId)}
                className="h-full w-full object-cover object-top transition-opacity duration-500"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-2.5">
                <p className="flex items-center gap-1 text-[13px] font-display font-bold text-white">
                  {p.name}, {p.age}
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                </p>
              </div>
              <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Online
              </span>
            </div>
            <div className="space-y-1.5 p-2">
              {p.lines.slice(0, lineLimit).map((l, i) => (
                <div
                  key={i}
                  className={`flex ${l.from === "member" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[88%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-snug ${
                      l.from === "member"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-muted/60 text-foreground"
                    }`}
                  >
                    {l.text}
                  </p>
                </div>
              ))}
              {showCta ? (
                <span className="mt-1.5 block rounded-xl bg-primary px-3 py-1.5 text-center text-[11px] font-bold text-primary-foreground">
                  Message {p.name} free
                </span>
              ) : null}
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
