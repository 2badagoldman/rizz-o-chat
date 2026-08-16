// Runtime store that maps demo AI host ids → showcase image URLs (signed).
// Populated once at app root via getShowcaseReel(). Consumed by
// host-avatars.ts so home / discover / chat cards show the same faces
// members see in the welcome reel — keeping the AI hosts visually
// consistent with the showcase.

import { useSyncExternalStore } from "react";
import { AI_HOST_IDS } from "./demo-hosts";
import { getShowcaseReel } from "./showcase-brain.functions";

type Overrides = Record<string, string>;

let overrides: Overrides = {};
const listeners = new Set<() => void>();

export function getShowcaseAvatar(id: string): string | undefined {
  if (typeof window !== "undefined") {
    const selected = sessionStorage.getItem(`crush:runway-avatar:${id}`);
    if (selected) return selected;
  }
  return overrides[id];
}

function setOverrides(next: Overrides) {
  overrides = next;
  for (const l of listeners) l();
}

/** Keep a runway card and its destination profile on the exact same face. */
export function registerShowcaseAvatars(items: Array<{ hostId: string; image: string }>) {
  const next = { ...overrides };
  let changed = false;
  for (const item of items) {
    if (!item.hostId || !item.image || next[item.hostId] === item.image) continue;
    next[item.hostId] = item.image;
    changed = true;
  }
  if (changed) setOverrides(next);
}

export function pinShowcaseAvatar(hostId: string, image: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`crush:runway-avatar:${hostId}`, image);
  }
  registerShowcaseAvatars([{ hostId, image }]);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Only expose IMAGE items — videos can't be used as still avatars.
async function fetchAndAssign() {
  try {
    const reel = await getShowcaseReel({ data: { limit: 20 } });
    const images = (reel ?? []).filter((r) => r.media_type === "image" && r.url);
    if (images.length === 0) return;

    // Deterministic pairing: each AI host id gets a specific showcase image
    // by natural order (host[0] → image[0], etc.) so the mapping is stable
    // between reloads even as new images are uploaded to the reel pool.
    const next: Overrides = {};
    const count = Math.min(AI_HOST_IDS.length, images.length);
    for (let i = 0; i < count; i++) {
      next[AI_HOST_IDS[i]] = images[i].url;
    }
    // A runway proof is a stronger identity binding than the generic reel order.
    setOverrides({ ...next, ...overrides });
  } catch {
    // silent — falls back to local elite portraits
  }
}

let started = false;
export function useShowcaseAvatarSync() {
  // Subscribe root to the store so any change causes RootComponent to
  // re-render, which cascades to Outlet + all avatar consumers.
  useSyncExternalStore(subscribe, () => overrides, () => overrides);
  if (typeof window !== "undefined" && !started) {
    started = true;
    void fetchAndAssign();
    // Refresh signed URLs every 45 minutes (they last 1h).
    window.setInterval(() => void fetchAndAssign(), 45 * 60 * 1000);
  }
}
