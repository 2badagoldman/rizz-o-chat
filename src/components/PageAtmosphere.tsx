/**
 * Shared "iPhone-grade" page atmosphere: drifting aurora light fields, slow
 * floating bubbles and the Diamond VIP prism sparkle field so every page
 * carries the same refraction language. Purely decorative, pointer-events
 * none, and honours prefers-reduced-motion via the global keyframe guards.
 *
 * Cost scales with the device: the `data-perf` tier (see lib/perf-tier.ts)
 * trims aurora layers, bubbles and sparkles on mid/low-end hardware, and the
 * whole layer is contained + paused when the tab is hidden.
 */
import { useEffect, useRef } from "react";
import { PrismSparkles } from "./Prism";
import { usePerfTier, useHydrated } from "@/hooks/usePerfTier";

const WAVE = (color: string, opacity: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 200' preserveAspectRatio='none'><path d='M0,120 C150,180 300,60 450,110 C600,160 750,50 900,100 C1050,150 1150,90 1200,110 L1200,200 L0,200 Z' fill='${color}' fill-opacity='${opacity}'/></svg>`,
  )}")`;

const SHAFTS = ["8%", "34%", "62%", "86%"];

const PETALS = [
  { left: "6%", size: 29, dur: "17s", delay: "0s", sway: "50px", color: "#d97e7e" },
  { left: "18%", size: 18, dur: "22s", delay: "3s", sway: "-40px", color: "#f3c9c2" },
  { left: "31%", size: 33, dur: "19s", delay: "6s", sway: "60px", color: "#c2536b" },
  { left: "47%", size: 23, dur: "25s", delay: "1.5s", sway: "-55px", color: "#e79aa1" },
  { left: "59%", size: 27, dur: "20s", delay: "8s", sway: "45px", color: "#d97e7e" },
  { left: "72%", size: 16, dur: "24s", delay: "4.5s", sway: "-35px", color: "#f6d9cf" },
  { left: "84%", size: 31, dur: "18s", delay: "10s", sway: "65px", color: "#b8465f" },
  { left: "93%", size: 21, dur: "23s", delay: "7s", sway: "-50px", color: "#e8a8ae" },
];

function SeaLayer() {
  return (
    <div className="theme-atmos sea-atmos">
      <div className="sea-veil" />
      {SHAFTS.map((left, i) => (
        <span key={left} className="sea-shaft" style={{ left, animationDelay: `${i * 1.7}s` }} />
      ))}
      <span
        className="sea-wave"
        style={{ backgroundImage: WAVE("%236fe4e0", 0.16), animationDuration: "22s", height: "48vh" }}
      />
      <span
        className="sea-wave"
        style={{ backgroundImage: WAVE("%231b7fb8", 0.28), animationDuration: "16s", bottom: "-12vh" }}
      />
      <span
        className="sea-wave"
        style={{ backgroundImage: WAVE("%2304122e", 0.55), animationDuration: "11s", bottom: "-16vh", height: "34vh" }}
      />
    </div>
  );
}

function RoseLayer() {
  return (
    <div className="theme-atmos rose-atmos">
      <span className="rose-bloom" style={{ left: "-12%", top: "6%", width: 260, height: 260 }} />
      <span className="rose-bloom" style={{ right: "-14%", bottom: "8%", width: 300, height: 300, animationDelay: "3s" }} />
      {PETALS.map((p) => (
        <span
          key={p.left}
          className="rose-petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            ["--dur" as string]: p.dur,
            ["--sway" as string]: p.sway,
            ["--petal-color" as string]: p.color,
          }}
        />
      ))}
    </div>
  );
}



const BUBBLES = [
  { left: "5%", size: 92, delay: "0s", tint: "from-primary/30" },
  { left: "22%", size: 42, delay: "1.4s", tint: "from-accent/40" },
  { left: "44%", size: 121, delay: "3.2s", tint: "from-primary/20" },
  { left: "63%", size: 54, delay: "0.9s", tint: "from-accent/30" },
  { left: "81%", size: 79, delay: "2.2s", tint: "from-primary/25" },
  { left: "94%", size: 33, delay: "4.1s", tint: "from-accent/40" },
];

const AURORAS = [
  { className: "left-[-18%] top-[-6%] h-72 w-72 bg-primary/20", anim: "aurora-drift 18s ease-in-out infinite alternate" },
  { className: "right-[-16%] top-[12%] h-64 w-64 bg-accent/20", anim: "aurora-drift 24s ease-in-out infinite alternate-reverse" },
  { className: "bottom-[-14%] left-[24%] h-80 w-80 bg-primary/15", anim: "aurora-drift 30s ease-in-out infinite alternate" },
];

export function PageAtmosphere() {
  const tier = usePerfTier();
  const hydrated = useHydrated();
  // Before hydration assume the rich layer so SSR markup stays stable.
  const level = hydrated ? tier : "full";

  const auroras = level === "lite" ? AURORAS.slice(0, 1) : level === "mid" ? AURORAS.slice(0, 2) : AURORAS;
  const bubbles = level === "lite" ? [] : level === "mid" ? BUBBLES.slice(0, 3) : BUBBLES;

  // Scroll-linked depth: waves sink and light shafts rise as you scroll.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        ref.current?.style.setProperty("--sea-scroll", String(Math.min(1, window.scrollY / max)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-anim-scope
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <SeaLayer />
      <RoseLayer />

      {auroras.map((a) => (
        <div
          key={a.className}
          className={`absolute rounded-full blur-3xl ${a.className}`}
          style={level === "lite" ? undefined : { animation: a.anim, willChange: "transform" }}
        />
      ))}
      {bubbles.map((b) => (
        <span
          key={b.left}
          className={`bubble bottom-0 bg-gradient-to-br ${b.tint} to-transparent blur-[2px]`}
          style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
      {level === "full" && <PrismSparkles className="opacity-70" />}
      {level === "mid" && <PrismSparkles count={3} className="opacity-60" />}
    </div>

  );
}
