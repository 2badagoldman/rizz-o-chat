import { queryOptions } from "@tanstack/react-query";
import { getDemoProofs, type DemoProof } from "./demo-proofs.functions";

/**
 * Shared cache entry for the creator runway. Primed in the root loader so the
 * rail is present in the very first paint instead of popping in later.
 */
export function demoProofsQueryOptions(limit = 6) {
  return queryOptions<DemoProof[]>({
    queryKey: ["demo-proofs", limit],
    queryFn: () => getDemoProofs({ data: { limit } }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export const RUNWAY_LIMIT = 20;
