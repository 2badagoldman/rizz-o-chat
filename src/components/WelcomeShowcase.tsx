import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown, Volume2, VolumeX, Sparkles, ArrowRight, Minimize2 } from "lucide-react";
import { getShowcaseReel, logShowcaseEvent, type ReelItem } from "@/lib/showcase-brain.functions";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const FLAG_KEY = "rizzla:showWelcome";       // explicit trigger (e.g. right after sign-up)
const SEEN_KEY = "rizzla:welcomeSeen";       // once per browser
const AUTO_ADVANCE_MS = 5_000;
const MIN_VIEW_MS = 30_000;                  // 30s minimum before soft close

type ShowcaseItem = ReelItem;

export function markWelcomeShowcasePending() {
  try {
    localStorage.setItem(FLAG_KEY, "1");
    localStorage.removeItem(SEEN_KEY);
  } catch {}
}

export function WelcomeShowcase() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const loggedImpressions = useRef<Set<string>>(new Set());

  // Decide whether to show — brain-ranked reel, unique shuffle each session.
  useEffect(() => {
    let seen = false;
    let pending = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
      pending = localStorage.getItem(FLAG_KEY) === "1";
    } catch {}
    if (seen && !pending) return;

    (async () => {
      try {
        const reel = await getShowcaseReel({ data: { limit: 8 } });
        if (!reel || reel.length === 0) return;
        setItems(reel);
        setIndex(0);
        setOpen(true);
      } catch {
        // silent — showcase is nice-to-have
      }
    })();
  }, []);

  // Log impression per slide (once per session)
  useEffect(() => {
    if (!open || items.length === 0) return;
    const cur = items[index];
    if (!cur || loggedImpressions.current.has(cur.id)) return;
    loggedImpressions.current.add(cur.id);
    logShowcaseEvent({ data: { id: cur.id, event: "impression" } }).catch(() => {});
  }, [open, index, items]);

  const close = (reason: "complete" | "dismiss" = "dismiss") => {
    // Fire an event for the current slide before tearing down
    const cur = items[index];
    if (cur) logShowcaseEvent({ data: { id: cur.id, event: reason } }).catch(() => {});
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
      localStorage.removeItem(FLAG_KEY);
    } catch {}
    Object.values(videoRefs.current).forEach((v) => v?.pause());
  };

  // Elapsed tick
  useEffect(() => {
    if (!open) return;
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(iv);
  }, [open]);

  // Autoplay + auto-advance
  useEffect(() => {
    if (!open || items.length === 0) return;
    const current = videoRefs.current[index];
    Object.entries(videoRefs.current).forEach(([k, v]) => {
      if (Number(k) !== index) {
        v?.pause();
        if (v) v.currentTime = 0;
      }
    });
    if (current) {
      current.muted = muted;
      current.play().catch(() => {});
    }
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [open, index, items.length, muted]);

  // Scroll to current slide
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * el.clientHeight, behavior: "smooth" });
  }, [index, open]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    const i = Math.round(el.scrollTop / h);
    if (i !== index && i >= 0 && i < items.length) setIndex(i);
  };

  const progress = useMemo(() => items.map((_, i) => i), [items]);
  const minReached = elapsed >= MIN_VIEW_MS;
  const secondsLeft = Math.max(0, Math.ceil((MIN_VIEW_MS - elapsed) / 1000));

  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white animate-[fade-in_0.4s_ease-out]">
      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-3">
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-xl ring-1 ring-white/15"
          style={{ animation: "float-soft 4.5s ease-in-out infinite" }}
        >
          <img src={rizzAiLogo.url} alt="Rizzla" className="h-6 w-6 rounded-full" />
          <span className="text-xs font-semibold tracking-wide">Rizz Chat</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => close()}
            aria-label={minReached ? "Close welcome" : `Skip in ${secondsLeft}s`}
            title={minReached ? "Close" : `Skip in ${secondsLeft}s`}
            className={
              "grid h-9 w-9 place-items-center rounded-full backdrop-blur-xl ring-1 transition " +
              (minReached
                ? "bg-white/20 ring-white/30 hover:bg-white/30"
                : "bg-white/5 ring-white/10 text-white/60")
            }
          >
            {minReached ? <X className="h-4 w-4" /> : <span className="text-[10px] font-bold">{secondsLeft}</span>}
          </button>
        </div>
      </div>

      {/* progress dots */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center gap-1 px-4">
        {progress.map((i) => (
          <span
            key={i}
            className={`h-0.5 flex-1 max-w-16 rounded-full transition-all ${i === index ? "bg-white" : i < index ? "bg-white/70" : "bg-white/25"}`}
          />
        ))}
      </div>

      {/* Floating headline banner */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center px-4">
        <div
          className="max-w-[520px] rounded-2xl bg-gradient-to-r from-fuchsia-500/25 via-pink-500/20 to-sky-400/25 px-5 py-3 text-center shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] ring-1 ring-white/20 backdrop-blur-xl"
          style={{ animation: "rise-in 0.7s ease-out both, float-soft 5s ease-in-out 0.7s infinite" }}
        >
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">
            <Sparkles className="h-3 w-3" /> Rizz Chat
          </p>
          <p className="mt-1 text-base font-extrabold leading-tight drop-shadow">
            Chat with your favourite host now on Rizz Chat
          </p>
        </div>
      </div>

      {/* vertical snap reel */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => (
          <div key={item.id} className="relative h-full w-full snap-start overflow-hidden">
            {item.media_type === "video" ? (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={item.url}
                className="h-full w-full object-cover"
                playsInline
                loop
                muted={muted}
                preload={Math.abs(i - index) <= 1 ? "auto" : "none"}
              />
            ) : (
              <img
                src={item.url}
                alt={item.caption ?? "Rizzla showcase"}
                className="h-full w-full object-cover"
                style={{ animation: "kenburns 9s ease-out both" }}
              />
            )}
            {/* Layered gradients for cinematic depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />
            <div
              className="pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light"
              style={{
                background:
                  "radial-gradient(60% 40% at 30% 20%, rgba(236,72,153,0.35), transparent 70%), radial-gradient(50% 40% at 80% 90%, rgba(56,189,248,0.28), transparent 70%)",
                animation: "aurora-drift 12s ease-in-out infinite",
              }}
            />

            {/* Caption slides in */}
            <div
              className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-6 pb-28"
              style={{ animation: "rise-in 0.6s ease-out 0.2s both" }}
              key={`cap-${index}-${i}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                Rizzla · {i + 1} / {items.length}
              </p>
              <p className="max-w-[560px] text-xl font-extrabold leading-tight drop-shadow-lg">
                {item.caption ?? "Welcome to your new favorite space."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* nav buttons */}
      <div className="pointer-events-none absolute inset-y-0 right-2 z-30 flex flex-col items-center justify-center gap-3">
        <button
          onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
          aria-label="Previous"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % items.length)}
          aria-label="Next"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom CTAs — reveal after 30s minimum view */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-4">
        {minReached ? (
          <div
            className="mx-auto flex w-full max-w-[520px] items-center gap-2"
            style={{ animation: "rise-in 0.5s ease-out both" }}
          >
            <button
              onClick={() => close()}
              className="btn-brand flex-1 inline-flex items-center justify-center gap-2"
            >
              Enter Rizz Chat <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => close()}
              className="inline-flex items-center gap-1.5 rounded-[14px] bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-xl ring-1 ring-white/15 hover:bg-white/20"
              aria-label="Minimize showcase"
            >
              <Minimize2 className="h-4 w-4" /> Minimize
            </button>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-sky-400 transition-[width] duration-200"
                style={{ width: `${Math.min(100, (elapsed / MIN_VIEW_MS) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-white/70">
              Enjoy the reel · <span className="font-bold text-white">{secondsLeft}s</span> until you can enter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
