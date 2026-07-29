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

const SPIRES = [
  { left: "4%", w: 46, h: "34vh", dur: "9s", delay: "0s" },
  { left: "14%", w: 22, h: "20vh", dur: "11s", delay: "1.6s" },
  { left: "26%", w: 60, h: "46vh", dur: "8s", delay: "3.2s" },
  { left: "42%", w: 30, h: "26vh", dur: "13s", delay: "0.8s" },
  { left: "58%", w: 52, h: "40vh", dur: "10s", delay: "4.4s" },
  { left: "72%", w: 26, h: "22vh", dur: "12s", delay: "2.1s" },
  { left: "84%", w: 64, h: "52vh", dur: "9.5s", delay: "5.6s" },
  { left: "94%", w: 20, h: "18vh", dur: "14s", delay: "3.9s" },
];


function SeaLayer({ level }: { level: string }) {
  const shafts = level === "lite" ? SHAFTS.slice(0, 1) : level === "mid" ? SHAFTS.slice(0, 2) : SHAFTS;
  return (
    <div className="theme-atmos sea-atmos">
      <div className="sea-veil" />
      {shafts.map((left, i) => (
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

/**
 * SICO: a dystopian skyline under an irradiated sky. Perspective grid running
 * to the horizon, monolith spires, hue-shifting plasma blooms and CRT scan
 * glitches — colors that don't map to anything real.
 */
function SicoLayer({ level }: { level: string }) {
  const spires = level === "lite" ? SPIRES.slice(0, 3) : level === "mid" ? SPIRES.slice(0, 5) : SPIRES;
  return (
    <div className="theme-atmos sico-atmos">
      <div className="sico-veil" />
      <span className="sico-bloom" style={{ left: "-14%", top: "4%", width: 320, height: 320 }} />
      <span
        className="sico-bloom"
        style={{ right: "-16%", top: "34%", width: 380, height: 380, animationDelay: "-7s", animationDirection: "reverse" }}
      />
      {spires.map((s) => (
        <span
          key={s.left}
          className="sico-spire"
          style={{
            left: s.left,
            width: s.w,
            height: s.h,
            animationDelay: s.delay,
            ["--dur" as string]: s.dur,
          }}
        />
      ))}
      {level !== "lite" && <div className="sico-grid" />}
      {level === "full" && (
        <>
          <div className="sico-scan" />
          <span className="sico-glitch" style={{ top: "38%", ["--dur" as string]: "7s" }} />
          <span className="sico-glitch" style={{ top: "66%", ["--dur" as string]: "11s", animationDelay: "-3s" }} />
        </>
      )}
    </div>
  );
}


const ROSE_SVG = (petal: string, deep: string, leaf: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
      <path d='M50 96 C48 78 40 66 26 58' stroke='${leaf}' stroke-width='4' fill='none' stroke-linecap='round'/>
      <path d='M30 62 C18 56 12 46 14 36 C26 36 36 44 38 56 Z' fill='${leaf}'/>
      <circle cx='50' cy='42' r='30' fill='${petal}'/>
      <path d='M50 12 C68 18 78 32 76 48 C74 64 62 72 50 72 C38 72 26 64 24 48 C22 32 32 18 50 12 Z' fill='${deep}' opacity='.55'/>
      <circle cx='50' cy='42' r='20' fill='${petal}'/>
      <path d='M50 24 C62 28 68 36 66 46 C64 56 56 60 50 58 C44 56 38 50 38 42 C38 32 42 26 50 24 Z' fill='${deep}' opacity='.5'/>
      <circle cx='50' cy='42' r='10' fill='${petal}'/>
      <path d='M50 34 C56 36 58 42 55 46 C52 50 46 48 45 43 C44 38 46 35 50 34 Z' fill='${deep}' opacity='.6'/>
    </svg>`,
  )}")`;

const ROMANCE_ROSES = [
  { side: "left" as const, top: "5%", size: 96, offset: "-16px", tilt: "-8deg", delay: "0s" },
  { side: "left" as const, top: "31%", size: 62, offset: "6px", tilt: "12deg", delay: "2.4s" },
  { side: "left" as const, top: "58%", size: 108, offset: "-26px", tilt: "-4deg", delay: "4.8s" },
  { side: "left" as const, top: "82%", size: 70, offset: "2px", tilt: "9deg", delay: "1.2s" },
  { side: "right" as const, top: "9%", size: 74, offset: "0px", tilt: "7deg", delay: "3.1s" },
  { side: "right" as const, top: "36%", size: 112, offset: "-24px", tilt: "-10deg", delay: "0.6s" },
  { side: "right" as const, top: "63%", size: 66, offset: "8px", tilt: "5deg", delay: "5.4s" },
  { side: "right" as const, top: "87%", size: 94, offset: "-14px", tilt: "-6deg", delay: "2.9s" },
];

/**
 * Romance: a deep valentine-red frame. Silk flows and roses live on the left
 * and right edges only — nothing falls across the content, so it never
 * distracts from reading or chatting.
 */
function RomanceLayer({ level }: { level: string }) {
  const roses =
    level === "lite"
      ? ROMANCE_ROSES.filter((_, i) => i % 4 === 0)
      : level === "mid"
        ? ROMANCE_ROSES.filter((_, i) => i % 2 === 0)
        : ROMANCE_ROSES;

  const deepRose = ROSE_SVG("#d81e3c", "#5c0a18", "#3f6b3a");
  const softRose = ROSE_SVG("#f28a97", "#a30d26", "#4a7a44");

  return (
    <div className="theme-atmos romance-atmos">
      <span className="romance-edge is-left" />
      <span className="romance-edge is-right" />
      {level !== "lite" && (
        <>
          <span className="romance-flow is-left" />
          <span className="romance-flow is-right" />
        </>
      )}
      <span className="romance-glow" style={{ left: "-10%", top: "10%", width: 260, height: 260 }} />
      <span className="romance-glow" style={{ right: "-12%", bottom: "12%", width: 300, height: 300, animationDelay: "5s" }} />
      {roses.map((r, i) => (
        <span
          key={`${r.side}-${r.top}`}
          className="romance-rose"
          style={{
            top: r.top,
            width: r.size,
            height: r.size,
            [r.side]: r.offset,
            backgroundImage: i % 2 === 0 ? deepRose : softRose,
            animationDelay: r.delay,
            ["--tilt" as string]: r.tilt,
          }}
        />
      ))}
    </div>
  );
}


const SHARDS = [
  { left: "7%", size: 34, dur: "21s", delay: "0s", sway: "44px" },
  { left: "19%", size: 20, dur: "26s", delay: "3.4s", sway: "-38px" },
  { left: "33%", size: 42, dur: "19s", delay: "6.2s", sway: "56px" },
  { left: "48%", size: 26, dur: "28s", delay: "1.8s", sway: "-50px" },
  { left: "61%", size: 30, dur: "23s", delay: "8.5s", sway: "40px" },
  { left: "76%", size: 18, dur: "25s", delay: "4.6s", sway: "-32px" },
  { left: "88%", size: 38, dur: "20s", delay: "10.2s", sway: "60px" },
  { left: "96%", size: 22, dur: "24s", delay: "7.1s", sway: "-46px" },
];

const FIZZ = [
  { left: "12%", size: 10, dur: "13s", delay: "0s", sway: "16px" },
  { left: "27%", size: 6, dur: "17s", delay: "2.2s", sway: "-12px" },
  { left: "41%", size: 13, dur: "11s", delay: "4.8s", sway: "22px" },
  { left: "55%", size: 7, dur: "16s", delay: "1.1s", sway: "-18px" },
  { left: "69%", size: 11, dur: "14s", delay: "6.4s", sway: "14px" },
  { left: "83%", size: 8, dur: "18s", delay: "3.7s", sway: "-20px" },
];

const GLINTS = [
  { left: "12%", top: "18%", size: 22, dur: "7s", delay: "0.4s" },
  { left: "76%", top: "12%", size: 16, dur: "9s", delay: "2.1s" },
  { left: "58%", top: "62%", size: 26, dur: "8s", delay: "4.6s" },
  { left: "24%", top: "74%", size: 18, dur: "11s", delay: "6.2s" },
  { left: "88%", top: "48%", size: 14, dur: "10s", delay: "1.3s" },
];

/**
 * Crush: signature soda-orange poured over glass and cold light.
 * Rotating citrus rays, chrome sheen sweep, sloshing liquid line,
 * tumbling ice shards, rising carbonation and sparkle glints.
 */
function CrushLayer({ level }: { level: string }) {
  const shards = level === "lite" ? SHARDS.slice(0, 3) : level === "mid" ? SHARDS.slice(0, 5) : SHARDS;
  const fizz = level === "lite" ? [] : level === "mid" ? FIZZ.slice(0, 3) : FIZZ;
  const glints = level === "lite" ? [] : level === "mid" ? GLINTS.slice(0, 3) : GLINTS;
  return (
    <div className="theme-atmos crush-atmos">
      <div className="crush-veil" />
      {level !== "lite" ? <div className="crush-rays" /> : null}
      <div className="crush-frost" />
      <span className="crush-edge is-left" />
      <span className="crush-edge is-right" />
      <span className="crush-glow" style={{ left: "-12%", top: "8%", width: 300, height: 300 }} />
      <span
        className="crush-glow is-gold"
        style={{ left: "46%", top: "-8%", width: 340, height: 340, animationDelay: "2s" }}
      />
      <span
        className="crush-glow is-ice"
        style={{ right: "-14%", bottom: "10%", width: 340, height: 340, animationDelay: "4s" }}
      />
      <div className="crush-liquid is-back" />
      <div className="crush-liquid" />
      {level !== "lite" ? <span className="crush-sheen" /> : null}
      {shards.map((s) => (
        <span
          key={`shard-${s.left}`}
          className="crush-shard"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            ["--dur" as string]: s.dur,
            ["--sway" as string]: s.sway,
          }}
        />
      ))}
      {fizz.map((f) => (
        <span
          key={`fizz-${f.left}`}
          className="crush-fizz"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            animationDelay: f.delay,
            ["--dur" as string]: f.dur,
            ["--sway" as string]: f.sway,
          }}
        />
      ))}
      {glints.map((g) => (
        <span
          key={`glint-${g.left}-${g.top}`}
          className="crush-glint"
          style={{
            left: g.left,
            top: g.top,
            width: g.size,
            height: g.size,
            animationDelay: g.delay,
            ["--dur" as string]: g.dur,
          }}
        />
      ))}
    </div>
  );
}



const BUBBLES = [
  { left: "5%", size: 44, delay: "0s", tint: "from-primary/30" },
  { left: "22%", size: 20, delay: "1.4s", tint: "from-accent/40" },
  { left: "44%", size: 58, delay: "3.2s", tint: "from-primary/20" },
  { left: "63%", size: 26, delay: "0.9s", tint: "from-accent/30" },
  { left: "81%", size: 38, delay: "2.2s", tint: "from-primary/25" },
  { left: "94%", size: 16, delay: "4.1s", tint: "from-accent/40" },

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
      <SeaLayer level={level} />
      <SicoLayer level={level} />
      <RomanceLayer level={level} />
      <CrushLayer level={level} />

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
