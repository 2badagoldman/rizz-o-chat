import { queryOptions } from "@tanstack/react-query";
import { getShowcaseReel, type ReelItem } from "./showcase-brain.functions";

/** Fixed so every consumer sees the same reel → the same creator ownership. */
export const REEL_LIMIT = 25;

/**
 * Shared cache entry for the public showcase reel. Primed in the root loader
 * so the tiles (and the creator identities they carry) are present on first
 * paint and never fetched twice on a page.
 */
export function showcaseReelQueryOptions() {
  return queryOptions<ReelItem[]>({
    queryKey: ["showcase-reel", REEL_LIMIT],
    queryFn: () => getShowcaseReel({ data: { limit: REEL_LIMIT } }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
