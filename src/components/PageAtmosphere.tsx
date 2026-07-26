/**
 * Shared "iPhone-grade" page atmosphere: drifting aurora light fields, slow
 * floating bubbles and the Diamond VIP prism sparkle field so every page
 * carries the same refraction language. Purely decorative, pointer-events
 * none, and honours prefers-reduced-motion via the global keyframe guards.
 */
import { PrismSparkles } from "./Prism";


const BUBBLES = [
  { left: "5%", size: 44, delay: "0s", tint: "from-primary/30" },
  { left: "22%", size: 20, delay: "1.4s", tint: "from-accent/40" },
  { left: "44%", size: 58, delay: "3.2s", tint: "from-primary/20" },
  { left: "63%", size: 26, delay: "0.9s", tint: "from-accent/30" },
  { left: "81%", size: 38, delay: "2.2s", tint: "from-primary/25" },
  { left: "94%", size: 16, delay: "4.1s", tint: "from-accent/40" },
];

export function PageAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-[-18%] top-[-6%] h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        style={{ animation: "aurora-drift 18s ease-in-out infinite alternate" }}
      />
      <div
        className="absolute right-[-16%] top-[12%] h-64 w-64 rounded-full bg-accent/20 blur-3xl"
        style={{ animation: "aurora-drift 24s ease-in-out infinite alternate-reverse" }}
      />
      <div
        className="absolute bottom-[-14%] left-[24%] h-80 w-80 rounded-full bg-primary/15 blur-3xl"
        style={{ animation: "aurora-drift 30s ease-in-out infinite alternate" }}
      />
      {BUBBLES.map((b) => (
        <span
          key={b.left}
          className={`bubble bottom-0 bg-gradient-to-br ${b.tint} to-transparent blur-[2px]`}
          style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
}
