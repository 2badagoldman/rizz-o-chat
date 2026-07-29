import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X, Volume2, VolumeX, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getShowcaseReel, logShowcaseEvent, type ReelItem } from "@/lib/showcase-brain.functions";
import { track } from "@/lib/analytics";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const FLAG_KEY = "rizzla:showWelcome";           // explicit trigger (e.g. right after sign-up)
const SESSION_SHOWN_KEY = "rizzla:welcomeShown"; // once per browser session
const LAST_SHOWN_KEY = "rizzla:welcomeLastAt";   // cross-session throttle
const AUTO_ADVANCE_MS = 2_000;                   // slide changes every 2s
const AUTO_CLOSE_MS = 24_000;                    // auto-close
const MIN_COOLDOWN_MS = 6 * 60 * 60 * 1000;      // don't repop for 6h across sessions
const EXIT_ANIM_MS = 420;

type ShowcaseItem = ReelItem;

export function markWelcomeShowcasePending() {
  try {
    localStorage.setItem(FLAG_KEY, "1");
    sessionStorage.removeItem(SESSION_SHOWN_KEY);
    localStorage.removeItem(LAST_SHOWN_KEY);
  } catch {}
}

export function WelcomeShowcase() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Never cover legal/policy pages — Stripe and other reviewers need to read the text.
  const isLegalPage = pathname.startsWith("/legal");

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const loggedImpressions = useRef<Set<string>>(new Set());
  const closedRef = useRef(false);
  const openedAtRef = useRef<number>(0);

  const loadReel = async () => {
    const t0 = Date.now();
    try {
      const reel = await getShowcaseReel({ data: { limit: 20 } });
      const loadMs = Date.now() - t0;
      if (!reel || reel.length === 0) {
        track("showcase_empty", { metadata: { load_ms: loadMs } });
        return;
      }
      track("showcase_reel_loaded", { metadata: { count: reel.length, load_ms: loadMs } });
      setItems(reel);
      setIndex(0);
      setElapsed(0);
      loggedImpressions.current = new Set();
      closedRef.current = false;
      openedAtRef.current = Date.now();
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      track("showcase_shown", { metadata: { count: reel.length } });
    } catch (err) {
      track("showcase_load_error", {
        metadata: { message: err instanceof Error ? err.message : String(err) },
      });
    }
  };

  useEffect(() => {
    if (isLegalPage) return;

    let pending = false;
    let lastAt = 0;
    let shownThisSession = false;
    try {
      pending = localStorage.getItem(FLAG_KEY) === "1";
      lastAt = Number(localStorage.getItem(LAST_SHOWN_KEY) || 0);
      shownThisSession = sessionStorage.getItem(SESSION_SHOWN_KEY) === "1";
    } catch {}

    const now = Date.now();
    const cooldownOk = now - lastAt > MIN_COOLDOWN_MS;
    const shouldShow = pending || (!shownThisSession && cooldownOk);

    track("showcase_mount_check", {
      metadata: { pending, shown_this_session: shownThisSession, cooldown_ok: cooldownOk, pathname },
    });

    if (!shouldShow) return;
    const t = setTimeout(loadReel, pending ? 200 : 800);
    return () => clearTimeout(t);
  }, [isLegalPage, pathname]);

  // Log impression per slide
  useEffect(() => {
    if (!mounted || items.length === 0) return;
    const cur = items[index];
    if (!cur || loggedImpressions.current.has(cur.id)) return;
    loggedImpressions.current.add(cur.id);
    logShowcaseEvent({ data: { id: cur.id, event: "impression" } }).catch(() => {});
    track("showcase_impression", { metadata: { slide_id: cur.id, index, total: items.length } });
  }, [mounted, index, items]);

  const close = (reason: "complete" | "dismiss" = "dismiss") => {
    if (closedRef.current) return;
    closedRef.current = true;
    const cur = items[index];
    const elapsedMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    if (cur) logShowcaseEvent({ data: { id: cur.id, event: reason } }).catch(() => {});
    track(reason === "complete" ? "showcase_completed" : "showcase_dismissed", {
      duration_ms: elapsedMs,
      metadata: { last_index: index, total: items.length, slide_id: cur?.id },
    });

    try {
      sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      localStorage.removeItem(FLAG_KEY);
    } catch {}

    setVisible(false);
    Object.values(videoRefs.current).forEach((v) => v?.pause());
    setTimeout(() => setMounted(false), EXIT_ANIM_MS);
  };

  // Auto-close + progress
  useEffect(() => {
    if (!mounted) return;
    const start = Date.now();
    const iv = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      if (e >= AUTO_CLOSE_MS && !closedRef.current) {
        clearInterval(iv);
        close("complete");
      }
    }, 200);
    return () => clearInterval(iv);
  }, [mounted]);

  // Autoplay current video + advance every 2s (videos get a little longer)
  useEffect(() => {
    if (!mounted || items.length === 0) return;
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
    const isVideo = items[index]?.media_type === "video";
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % items.length),
      isVideo ? AUTO_ADVANCE_MS * 3 : AUTO_ADVANCE_MS,
    );
    return () => clearTimeout(t);
  }, [mounted, index, items, muted]);

  const autoPct = Math.min(100, (elapsed / AUTO_CLOSE_MS) * 100);
  const current = items[index];

  if (!mounted || !current) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[100] flex items-center justify-center p-4 text-white transition-all duration-[420ms] ease-out will-change-[opacity,transform] " +
        (visible ? "opacity-100" : "opacity-0 pointer-events-none")
      }
    >
      {/* soft backdrop, tap to close */}
      <button
        aria-label="Close welcome"
        onClick={() => close()}
        className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(236,72,153,0.35),transparent_70%),rgba(8,6,14,0.86)] backdrop-blur-xl"
      />

      {/* card */}
      <div
        className={
          "relative z-10 w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white/[0.06] ring-1 ring-white/15 shadow-[0_30px_90px_-20px_rgba(236,72,153,0.55)] backdrop-blur-2xl transition-all duration-[420ms] ease-out " +
          (visible ? "translate-y-0 scale-100" : "translate-y-4 scale-[0.97]")
        }
      >
        {/* auto-close progress */}
        <div className="absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-sky-400 transition-[width] duration-200 ease-linear"
            style={{ width: `${autoPct}%` }}
          />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <img src={rizzAiLogo.url} alt="Crush" className="h-7 w-7 rounded-full ring-1 ring-white/25" />
            <div className="leading-tight">
              <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">
                <Sparkles className="h-2.5 w-2.5" /> Welcome
              </p>
              <p className="text-sm font-extrabold">Crush Chat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {current.media_type === "video" && (
              <button
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20"
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              onClick={() => close()}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* media stage — crossfade, framed so faces aren't cropped tight */}
        <div className="relative mx-4 aspect-[4/5] overflow-hidden rounded-[22px] bg-black/40 ring-1 ring-white/10">
          {items.map((item, i) =>
            item.media_type === "video" ? (
              <video
                key={item.id}
                ref={(el) => { videoRefs.current[i] = el; }}
                src={item.url}
                className={
                  "absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-out " +
                  (i === index ? "opacity-100" : "opacity-0")
                }
                playsInline
                loop
                muted={muted}
                preload={Math.abs(i - index) <= 1 ? "auto" : "none"}
              />
            ) : (
              <img
                key={item.id}
                src={item.url}
                alt={item.caption ?? "Crush showcase"}
                loading={Math.abs(i - index) <= 2 ? "eager" : "lazy"}
                className={
                  "absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-out " +
                  (i === index ? "opacity-100" : "opacity-0")
                }
              />
            ),
          )}

          {/* subtle bottom scrim for caption legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

          {/* arrows */}
          <button
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            aria-label="Previous"
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 ring-1 ring-white/20 backdrop-blur transition hover:bg-black/55"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            aria-label="Next"
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 ring-1 ring-white/20 backdrop-blur transition hover:bg-black/55"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* caption */}
        <div className="px-5 pt-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50">
            {index + 1} / {items.length}
          </p>
          <p key={`cap-${index}`} className="mt-1 min-h-[3rem] text-lg font-extrabold leading-snug animate-fade-in">
            {current.caption ?? "Welcome to your new favourite space."}
          </p>
        </div>

        {/* dots */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 p-5">
          <button
            onClick={() => close("complete")}
            className="btn-brand inline-flex flex-1 items-center justify-center gap-2 hover-scale"
          >
            Enter Crush Chat <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => close()}
            className="rounded-[14px] bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
