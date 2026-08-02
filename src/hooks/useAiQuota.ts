import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGoldAccess } from "@/hooks/useGoldAccess";

/**
 * Free AI-response quota. Every AI experience (AI hosts/co-hosts + the Crush AI
 * dock) gives free members 3 replies, then they hit the subscription wall.
 * Crush Gold / Diamond members are never limited.
 */
export const AI_FREE_LIMIT = 3;


export function useAiQuota(scope: string, limit: number = AI_FREE_LIMIT) {
  const { user } = useAuth();
  const { hasGold, loading } = useGoldAccess();
  const storageKey = `crush:aiquota:${scope}:${user?.id ?? "anon"}`;
  const [used, setUsed] = useState(0);
  const prevCount = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = Number(localStorage.getItem(storageKey) ?? "0");
    setUsed(Number.isFinite(raw) ? raw : 0);
    prevCount.current = null;
  }, [storageKey]);

  /** Feed the current number of assistant replies in the thread. */
  const track = useCallback(
    (assistantCount: number) => {
      if (prevCount.current === null) {
        prevCount.current = assistantCount;
        return;
      }
      const delta = assistantCount - prevCount.current;
      prevCount.current = assistantCount;
      if (delta <= 0) return;
      setUsed((u) => {
        const next = u + delta;
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  const unlimited = hasGold || loading;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    reached: !unlimited && used >= limit,
    unlimited,
    track,
  };
}
