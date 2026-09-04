// Runtime store that maps demo AI host ids → portrait URLs.
//
// Offline contract: creator faces must never depend on the network. Every
// portrait ships inside the app bundle (see host-avatars.ts), so this store
// only ever holds *bundled* image URLs — a runway card pins the exact face it
// showed so the destination profile / chat renders the same portrait.
//
// Remote (http/https) URLs are rejected on purpose: the old behaviour pulled
// one-hour signed storage links for AI hosts, which expired and turned cards
// black across Home / Discover / Chats.

import { useSyncExternalStore } from "react";

type Overrides = Record<string, string>;

let overrides: Overrides = {};
const listeners = new Set<() => void>();

/** Only bundled asset URLs are allowed to override a portrait. */
function isBundled(url: string): boolean {
  return !!url && !/^https?:\/\//i.test(url) && !url.startsWith("blob:") && !url.startsWith("data:");
}

export function getShowcaseAvatar(id: string): string | undefined {
  if (typeof window !== "undefined") {
    const key = `crush:runway-avatar:${id}`;
    const selected = sessionStorage.getItem(key);
    if (selected) {
      if (isBundled(selected)) return selected;
      // Stale remote pin from a previous build — drop it.
      sessionStorage.removeItem(key);
    }
  }
  const o = overrides[id];
  return o && isBundled(o) ? o : undefined;
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
    if (!item.hostId || !isBundled(item.image) || next[item.hostId] === item.image) continue;
    next[item.hostId] = item.image;
    changed = true;
  }
  if (changed) setOverrides(next);
}

export function pinShowcaseAvatar(hostId: string, image: string) {
  if (!isBundled(image)) return;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`crush:runway-avatar:${hostId}`, image);
  }
  registerShowcaseAvatars([{ hostId, image }]);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Subscribe the root to the store so a pin re-renders every avatar consumer.
 * No network fetch happens here anymore — portraits are always local.
 */
export function useShowcaseAvatarSync() {
  useSyncExternalStore(subscribe, () => overrides, () => overrides);
}
