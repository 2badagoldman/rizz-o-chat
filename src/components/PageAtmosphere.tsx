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
 * SICO: a romantic dusk horizon. Orchid and champagne silk blooms drifting
 * over a velvet skyline — no scanlines, no glitching, nothing distracting.
 */
function SicoLayer({ level }: { level: string }) {
  const spires = level === "lite" ? SPIRES.slice(0, 3) : level === "mid" ? SPIRES.slice(0, 5) : SPIRES;
  return (
    <div className="theme-atmos sico-atmos">
      <div className="sico-veil" />
      <span className="sico-bloom" style={{ left: "-14%", top: "4%", width: 320, height: 320 }} />
      <span
        className="sico-bloom"
        style={{ right: "-16%", top: "34%", width: 380, height: 380, animationDelay: "-11s", animationDirection: "reverse" }}
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
    </div>
  );
}



/**
 * Couture rose: a real layered bloom. Petals are generated as rotated
 * teardrops in three descending whorls, each shaded with its own radial
 * gradient plus a gilded rim light and a specular silk sheen, so it reads as
 * velvet under studio light instead of stacked flat circles.
 */
const PETAL = "M0 0 C-27 -13 -31 -44 -12 -60 C-5 -66 5 -66 12 -60 C31 -44 27 -13 0 0 Z";

const whorl = (count: number, scale: number, spin: number, fill: string, rim: string, opacity: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = spin + (360 / count) * i;
    return `<path d='${PETAL}' fill='${fill}' stroke='${rim}' stroke-width='.6' stroke-opacity='.5' opacity='${opacity}' transform='rotate(${a}) scale(${scale})'/>`;
  }).join("");

const ROSE_SVG = (petal: string, deep: string, leaf: string, gold = "#f3d08a") =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 150'>
      <defs>
        <radialGradient id='o' cx='50%' cy='78%' r='72%'>
          <stop offset='0%' stop-color='${petal}'/>
          <stop offset='58%' stop-color='${petal}'/>
          <stop offset='100%' stop-color='${deep}'/>
        </radialGradient>
        <radialGradient id='m' cx='50%' cy='80%' r='70%'>
          <stop offset='0%' stop-color='${deep}'/>
          <stop offset='45%' stop-color='${petal}'/>
          <stop offset='100%' stop-color='${deep}'/>
        </radialGradient>
        <radialGradient id='c' cx='50%' cy='60%' r='70%'>
          <stop offset='0%' stop-color='${deep}'/>
          <stop offset='100%' stop-color='${petal}'/>
        </radialGradient>
        <linearGradient id='lf' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${leaf}'/>
          <stop offset='100%' stop-color='${deep}' stop-opacity='.75'/>
        </linearGradient>
        <linearGradient id='sh' x1='.2' y1='0' x2='.8' y2='1'>
          <stop offset='0%' stop-color='#ffffff' stop-opacity='.5'/>
          <stop offset='45%' stop-color='#ffffff' stop-opacity='.06'/>
          <stop offset='100%' stop-color='#ffffff' stop-opacity='0'/>
        </linearGradient>
      </defs>
      <path d='M60 128 C58 116 56 106 48 96' stroke='url(#lf)' stroke-width='4' fill='none' stroke-linecap='round'/>
      <path d='M52 106 C36 102 26 92 26 78 C42 77 54 87 57 103 Z' fill='url(#lf)' opacity='.9'/>
      <path d='M33 82 C41 87 48 93 53 102' stroke='${deep}' stroke-opacity='.3' stroke-width='1.2' fill='none'/>
      <path d='M68 112 C82 110 91 101 93 89 C79 86 69 95 67 109 Z' fill='url(#lf)' opacity='.7'/>

      <g transform='translate(60 62)'>
        ${whorl(7, 1, 0, "url(#o)", deep, 0.98)}
        ${whorl(6, 0.72, 26, "url(#m)", deep, 0.96)}
        ${whorl(5, 0.48, 52, "url(#m)", deep, 0.97)}
        ${whorl(4, 0.3, 74, "url(#c)", deep, 1)}
        <path d='M0 -6 C7 -12 14 -6 10 2 C6 9 -4 9 -8 2 C-12 -6 -6 -14 2 -12' fill='none' stroke='${deep}' stroke-width='2' stroke-linecap='round' opacity='.9'/>
        <path d='${PETAL}' fill='url(#sh)' transform='rotate(-28) scale(1)'/>
        <path d='${PETAL}' fill='${gold}' opacity='.16' transform='rotate(38) scale(.98)'/>
      </g>
    </svg>`,
  )}")`;


const ROMANCE_ROSES = [
  { side: "left" as const, top: "5%", size: 96, offset: "-22px", tilt: "-8deg", delay: "0s", depth: 0 },
  { side: "left" as const, top: "31%", size: 62, offset: "4px", tilt: "12deg", delay: "2.4s", depth: 2 },
  { side: "left" as const, top: "58%", size: 118, offset: "-34px", tilt: "-4deg", delay: "4.8s", depth: 0 },
  { side: "left" as const, top: "82%", size: 74, offset: "0px", tilt: "9deg", delay: "1.2s", depth: 1 },
  { side: "right" as const, top: "9%", size: 78, offset: "-4px", tilt: "7deg", delay: "3.1s", depth: 1 },
  { side: "right" as const, top: "36%", size: 122, offset: "-32px", tilt: "-10deg", delay: "0.6s", depth: 0 },
  { side: "right" as const, top: "63%", size: 66, offset: "6px", tilt: "5deg", delay: "5.4s", depth: 2 },
  { side: "right" as const, top: "87%", size: 98, offset: "-18px", tilt: "-6deg", delay: "2.9s", depth: 1 },
];

const DEPTH = [
  { blur: "0px", opacity: 0.95 },
  { blur: "1.4px", opacity: 0.72 },
  { blur: "3px", opacity: 0.5 },
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

  const ROSE_ART = [
    ROSE_SVG("#e0233f", "#4d0714", "#2f5c31"),
    ROSE_SVG("#f6919c", "#9c0a22", "#3f6b3a"),
    ROSE_SVG("#c1122d", "#360510", "#26512c", "#ffe6a8"),
  ];

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
      {roses.map((r, i) => {
        const d = DEPTH[r.depth] ?? DEPTH[0];
        return (
          <span
            key={`${r.side}-${r.top}`}
            className="romance-rose"
            style={{
              top: r.top,
              width: r.size,
              height: Math.round(r.size * 1.25),
              [r.side]: r.offset,
              backgroundImage: ROSE_ART[i % ROSE_ART.length],
              animationDelay: r.delay,
              ["--tilt" as string]: r.tilt,
              ["--rose-blur" as string]: d.blur,
              ["--rose-op" as string]: String(d.opacity),
            }}
          />
        );
      })}

    </div>
  );
}


const GLINTS = [
  { left: "12%", top: "18%", size: 22, dur: "7s", delay: "0.4s" },
  { left: "76%", top: "12%", size: 16, dur: "9s", delay: "2.1s" },
  { left: "58%", top: "62%", size: 26, dur: "8s", delay: "4.6s" },
  { left: "24%", top: "74%", size: 18, dur: "11s", delay: "6.2s" },
  { left: "88%", top: "48%", size: 14, dur: "10s", delay: "1.3s" },
];

/**
 * Crush: couture saffron-to-ember orange under warm glass.
 * Slow gilded rays, a single chrome sheen sweep, a molten horizon and
 * rare gold glints. No falling particles.
 */

function CrushLayer({ level }: { level: string }) {
  const glints = level === "lite" ? [] : level === "mid" ? GLINTS.slice(0, 2) : GLINTS;
  const lite = level === "lite";
  const full = level === "full";
  return (
    <div className="theme-atmos crush-atmos">
      <div className="crush-veil" />
      {full ? <div className="crush-rays" /> : null}
      <div className="crush-frost" />
      <span className="crush-edge is-left" />
      <span className="crush-edge is-right" />
      <span className="crush-glow" style={{ left: "-12%", top: "8%", width: 320, height: 320 }} />
      {!lite && (
        <span
          className="crush-glow is-gold"
          style={{ left: "46%", top: "-10%", width: 380, height: 380, animationDelay: "2s" }}
        />
      )}
      {full && (
        <span
          className="crush-glow is-ember"
          style={{ right: "-14%", bottom: "8%", width: 360, height: 360, animationDelay: "4s" }}
        />
      )}
      {full ? <div className="crush-liquid is-back" /> : null}
      <div className="crush-liquid" />
      {full ? <span className="crush-sheen" /> : null}
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
