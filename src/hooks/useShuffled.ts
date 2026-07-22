import { useEffect, useState } from "react";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a shuffled copy of `items` that reshuffles every `intervalMs` (default 10s).
 * Pauses when the tab is hidden so we don't burn cycles in the background.
 */
export function useShuffled<T>(items: readonly T[], intervalMs = 10_000): T[] {
  // Start with the stable input order so SSR and first client render match;
  // shuffle only after hydration to avoid hydration mismatches.
  const [list, setList] = useState<T[]>(() => items.slice());


  useEffect(() => {
    setList(shuffle(items));
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id != null) return;
      id = setInterval(() => setList(shuffle(items)), intervalMs);
    };
    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [items, intervalMs]);

  return list;
}
