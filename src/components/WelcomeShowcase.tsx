import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown, Volume2, VolumeX, Sparkles, ArrowRight } from "lucide-react";
import { getShowcaseReel, logShowcaseEvent, type ReelItem } from "@/lib/showcase-brain.functions";
import { track } from "@/lib/analytics";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const FLAG_KEY = "rizzla:showWelcome";           // explicit trigger (e.g. right after sign-up)
const SESSION_SHOWN_KEY = "rizzla:welcomeShown"; // once per browser session
const LAST_SHOWN_KEY = "rizzla:welcomeLastAt";   // cross-session throttle
const AUTO_ADVANCE_MS = 5_000;                   // slide auto-advance
const AUTO_CLOSE_MS = 20_000;                    // auto-close after 20s
const MIN_COOLDOWN_MS = 6 * 60 * 60 * 1000;      // don't repop for 6h across sessions
const EXIT_ANIM_MS = 420;                        // matches fade-out below

type ShowcaseItem = ReelItem;

export function markWelcomeShowcasePending() {
  try {
    localStorage.setItem(FLAG_KEY, "1");
    sessionStorage.removeItem(SESSION_SHOWN_KEY);
    localStorage.removeItem(LAST_SHOWN_KEY);
  } catch {}
}

export function WelcomeShowcase() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
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
      // next frame → trigger CSS transition
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      track("showcase_shown", { metadata: { count: reel.length } });
    } catch (err) {
      track("showcase_load_error", {
        metadata: { message: err instanceof Error ? err.message : String(err) },
      });
    }
  };

  // Decide whether/when to pop. Runs once on mount.
  useEffect(() => {
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
      metadata: { pending, shown_this_session: shownThisSession, cooldown_ok: cooldownOk },
    });

    if (!shouldShow) return;
    // small delay so hydration settles and the fade-in feels intentional
    const t = setTimeout(loadReel, pending ? 200 : 800);
    return () => clearTimeout(t);
  }, []);

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

    // Smooth exit: fade → then unmount
    setVisible(false);
    Object.values(videoRefs.current).forEach((v) => v?.pause());
    setTimeout(() => setMounted(false), EXIT_ANIM_MS);
  };

  // Auto-close after AUTO_CLOSE_MS, and drive the progress bar
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

  // Autoplay + auto-advance
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
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [mounted, index, items.length, muted]);

  // Scroll to current slide
  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * el.clientHeight, behavior: "smooth" });
  }, [index, mounted]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    const i = Math.round(el.scrollTop / h);
    if (i !== index && i >= 0 && i < items.length) setIndex(i);
  };

  const progress = useMemo(() => items.map((_, i) => i), [items]);
  const autoPct = Math.min(100, (elapsed / AUTO_CLOSE_MS) * 100);

  if (!mounted || items.length === 0) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[100] bg-black text-white transition-all duration-[420ms] ease-out will-change-[opacity,transform] " +
        (visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98] pointer-events-none")
      }
    >
      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-xl ring-1 ring-white/15">
          <img src={rizzAiLogo.url} alt="Rizzla" className="h-6 w-6 rounded-full" />
          <span className="text-xs font-semibold tracking-wide">Rizz Chat</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15 transition hover:bg-white/20"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => close()}
            aria-label="Close welcome"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-xl transition hover:bg-white/30 hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* auto-close progress bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-0.5 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-sky-400 transition-[width] duration-200 ease-linear"
          style={{ width: `${autoPct}%` }}
        />
      </div>

      {/* progress dots */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center gap-1 px-4">
        {progress.map((i) => (
          <span
            key={i}
            className={`h-0.5 flex-1 max-w-16 rounded-full transition-all duration-500 ${
              i === index ? "bg-white" : i < index ? "bg-white/70" : "bg-white/25"
            }`}
          />
        ))}
      </div>

      {/* Floating headline banner */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center px-4">
        <div className="max-w-[520px] rounded-2xl bg-gradient-to-r from-fuchsia-500/25 via-pink-500/20 to-sky-400/25 px-5 py-3 text-center shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] ring-1 ring-white/20 backdrop-blur-xl animate-fade-in">
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
              }}
            />

            {/* Caption */}
            <div
              className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-6 pb-28 animate-fade-in"
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
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15 transition hover:bg-white/20 hover:scale-105"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % items.length)}
          aria-label="Next"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15 transition hover:bg-white/20 hover:scale-105"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom CTA — always available, no forced wait */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-4 animate-fade-in">
        <div className="mx-auto flex w-full max-w-[520px] items-center gap-2">
          <button
            onClick={() => close("complete")}
            className="btn-brand flex-1 inline-flex items-center justify-center gap-2 hover-scale"
          >
            Enter Rizz Chat <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => close()}
            className="inline-flex items-center gap-1.5 rounded-[14px] bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl ring-1 ring-white/15 transition hover:bg-white/20"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
