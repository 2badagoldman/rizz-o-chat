// Creator Identity Manager — the single source of truth for "which creator
// owns this photo".
//
// Every marketing photo (runway proof, showcase reel tile) is claimed by
// exactly one demo creator, and the claim is a pure function of static data:
// it never depends on database ordering, fetch limits, array indexes after a
// filter, or client-side shuffles. That is what guarantees a tapped photo
// always opens the profile of the person in the photo.
//
// Client-safe: only static catalogue data, no network, no secrets.
import { AI_HOST_IDS, DEMO_HOSTS, type DemoHost } from "./demo-hosts";
import { PERSONAS } from "./demo-proofs.data";

export type DemoPersona = (typeof PERSONAS)[number];
export type RunwaySlot = { index: number; persona: DemoPersona; host: DemoHost };

const HOST_BY_ID = new Map(DEMO_HOSTS.map((h) => [h.id, h] as const));

/** Seats that must never be used as a marketing face (Jen is a real creator's seat). */
const EXCLUDED_HOST_IDS = new Set<string>(["demo-jen"]);

/**
 * Who gets a photo when a persona has no same-name creator: AI-powered
 * creators first (free chat works for signed-out visitors), then the rest of
 * the catalogue in order. De-duplicated, exclusions removed.
 */
const PRIORITY_POOL: DemoHost[] = (() => {
  const seen = new Set<string>();
  const out: DemoHost[] = [];
  const push = (h: DemoHost | undefined) => {
    if (!h || seen.has(h.id) || EXCLUDED_HOST_IDS.has(h.id)) return;
    seen.add(h.id);
    out.push(h);
  };
  AI_HOST_IDS.forEach((id) => push(HOST_BY_ID.get(id)));
  DEMO_HOSTS.forEach(push);
  return out;
})();

/**
 * Runway slots: persona i ↔ one unique creator. Name match wins; otherwise the
 * next unclaimed creator from the priority pool. Deterministic and duplicate
 * free, so two cards can never point at the same profile.
 */
export const RUNWAY_SLOTS: RunwaySlot[] = (() => {
  const claimed = new Set<string>();
  const slots: RunwaySlot[] = [];
  const personas = PERSONAS.filter((p) => p.name.toLowerCase() !== "jen");
  personas.forEach((persona, index) => {
    const wanted = persona.name.toLowerCase();
    const byName = DEMO_HOSTS.find(
      (h) => h.name.toLowerCase() === wanted && !claimed.has(h.id) && !EXCLUDED_HOST_IDS.has(h.id),
    );
    const host = byName ?? PRIORITY_POOL.find((h) => !claimed.has(h.id));
    if (!host) return;
    claimed.add(host.id);
    slots.push({ index, persona, host });
  });
  return slots;
})();

export const RUNWAY_HOST_IDS: ReadonlySet<string> = new Set(RUNWAY_SLOTS.map((s) => s.host.id));

/** Creators available to own showcase-reel photos — disjoint from the runway. */
export const REEL_HOST_POOL: DemoHost[] = PRIORITY_POOL.filter((h) => !RUNWAY_HOST_IDS.has(h.id));

/**
 * Deterministic reel photo → creator mapping. Keyed on the sorted media ids so
 * a client-side reshuffle (or the order the database happens to return rows)
 * never changes who owns which photo.
 */
export function assignReelHosts(mediaIds: string[]): Map<string, DemoHost> {
  const sorted = Array.from(new Set(mediaIds)).sort();
  const out = new Map<string, DemoHost>();
  sorted.forEach((id, i) => {
    const host = REEL_HOST_POOL[i % REEL_HOST_POOL.length];
    if (host) out.set(id, host);
  });
  return out;
}

export function creatorById(id: string | null | undefined): DemoHost | undefined {
  return id ? HOST_BY_ID.get(id) : undefined;
}

/** Self-audit used by the Identity Manager (ops) and tests. */
export function auditIdentityMap(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const ids = RUNWAY_SLOTS.map((s) => s.host.id);
  if (new Set(ids).size !== ids.length) issues.push("runway assigns one creator to two photos");
  if (ids.some((id) => EXCLUDED_HOST_IDS.has(id))) issues.push("runway uses an excluded creator seat");
  if (REEL_HOST_POOL.some((h) => RUNWAY_HOST_IDS.has(h.id))) issues.push("reel pool overlaps the runway");
  if (REEL_HOST_POOL.length === 0) issues.push("reel pool is empty");
  return { ok: issues.length === 0, issues };
}
