import { useEffect, useState, useSyncExternalStore } from "react";
import { getPerfTier, initPerfTier, onPerfTierChange, type PerfTier } from "@/lib/perf-tier";

/** Subscribe to the live performance tier (SSR-safe, defaults to "full"). */
export function usePerfTier(): PerfTier {
  const tier = useSyncExternalStore(
    (cb) => onPerfTierChange(() => cb()),
    () => getPerfTier(),
    () => "full" as PerfTier,
  );
  return tier;
}

/** True once the client has hydrated — use to avoid SSR/client markup drift. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Boots tier detection once, from the app root. */
export function useInitPerfTier() {
  useEffect(() => initPerfTier(), []);
}
