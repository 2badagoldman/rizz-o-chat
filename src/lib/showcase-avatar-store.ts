// Creator identity registry — maps a creator id → the ONE image the app shows
// for her everywhere (runway, reel, Discover tiles, profile hero, chat header).
//
// Seeded from the root loader on every page (server and client alike) so SSR
// and hydration agree, and so the photo a visitor taps is the exact photo her
// profile opens with.
//
// Bundled asset URLs never expire. Remote (signed storage) URLs are trusted
// for a bounded window and then drop back to the bundled portrait, and the
// ImageGuard invalidates them the moment one fails to load — a creator card
// can therefore never render black.

import { useSyncExternalStore } from "react";

type Identity = { image: string; expiresAt: number };

/** Signed storage URLs live 60 min; stop trusting them a little before that. */
const REMOTE_TTL_MS = 50 * 60 * 1000;

let identities: Record<string, Identity> = {};
let version = 0;
const listeners = new Set<() => void>();

const isRemote = (url: string) => /^https?:\/\//i.test(url);

/** Only bundled asset URLs are allowed to override a portrait. */
export function isBundledImage(url: string): boolean {
  return !!url && !isRemote(url) && !url.startsWith("blob:") && !url.startsWith("data:");
}

function usable(url: string | null | undefined): url is string {
  return !!url && !url.startsWith("blob:") && !url.startsWith("data:");
}

function emit() {
  for (const l of listeners) l();
}

/** The canonical image for a creator, or undefined to use her bundled portrait. */
export function getShowcaseAvatar(id: string): string | undefined {
  const ident = identities[id];
  if (!ident) return undefined;
  if (ident.expiresAt <= Date.now()) return undefined;
  return ident.image;
}

/**
 * Register canonical images. Safe to call during render with `notify: false`
 * (the root does this so children render with the seeded map immediately).
 */
export function registerCreatorIdentities(
  items: Array<{ hostId: string; image: string }>,
  opts: { notify?: boolean } = {},
) {
  const now = Date.now();
  let next: Record<string, Identity> | null = null;
  for (const item of items) {
    if (!item.hostId || !usable(item.image)) continue;
    const cur = identities[item.hostId];
    if (cur && cur.image === item.image && cur.expiresAt > now) continue;
    next ??= { ...identities };
    next[item.hostId] = {
      image: item.image,
      expiresAt: isRemote(item.image) ? now + REMOTE_TTL_MS : Number.POSITIVE_INFINITY,
    };
  }
  if (!next) return;
  identities = next;
  version++;
  if (opts.notify !== false) emit();
}

/** Back-compat alias. */
export function registerShowcaseAvatars(items: Array<{ hostId: string; image: string }>) {
  registerCreatorIdentities(items);
}

/** Keep a card and its destination profile on the exact same face. */
export function pinShowcaseAvatar(hostId: string, image: string) {
  registerCreatorIdentities([{ hostId, image }]);
}

/**
 * A registered image failed to load (expired / offline). Forget it so every
 * surface falls back to the bundled portrait, and tell the caller whose it was.
 */
export function invalidateIdentityImage(src: string): string | undefined {
  if (!src) return undefined;
  const hit = Object.entries(identities).find(([, v]) => v.image === src);
  if (!hit) return undefined;
  const [hostId] = hit;
  const next = { ...identities };
  delete next[hostId];
  identities = next;
  version++;
  emit();
  return hostId;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Subscribe the root so any identity change re-renders every avatar consumer. */
export function useShowcaseAvatarSync() {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}
