import { useCallback, useRef, useState } from "react";

type Burst = { id: number; emoji: string; left: number; drift: number; spin: number; dur: number; delay: number };

/**
 * Floating emoji reactions — call `fire(emoji)` and a little cluster of that
 * emoji pops from the bottom of the chat and drifts up toward the host.
 */
export function useFloatingReactions() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seq = useRef(0);

  const fire = useCallback((emoji: string, count = 7) => {
    const next: Burst[] = Array.from({ length: count }, () => {
      const id = ++seq.current;
      return {
        id,
        emoji,
        left: 50 + (Math.random() * 34 - 17),
        drift: Math.random() * 120 - 60,
        spin: Math.random() * 60 - 30,
        dur: 1800 + Math.random() * 900,
        delay: Math.random() * 260,
      };
    });
    setBursts((b) => [...b, ...next]);
    const maxLife = 3400;
    window.setTimeout(() => {
      const ids = new Set(next.map((n) => n.id));
      setBursts((b) => b.filter((x) => !ids.has(x.id)));
    }, maxLife);
  }, []);

  const layer = (
    <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden" aria-hidden>
      {bursts.map((b) => (
        <span
          key={b.id}
          className="emoji-float absolute bottom-24 text-3xl drop-shadow"
          style={{
            left: `${b.left}%`,
            ["--drift" as string]: `${b.drift}px`,
            ["--spin" as string]: `${b.spin}deg`,
            ["--dur" as string]: `${b.dur}ms`,
            animationDelay: `${b.delay}ms`,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );

  return { fire, layer };
}
