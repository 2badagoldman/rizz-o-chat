// Portrait pool for demo hosts — elite editorial-grade AI portraits only.
// All images bundled locally in src/assets/elite/ (offline, CDN-free, Vite
// fingerprints & long-caches).
//
// Uniqueness contract: every demo host id gets a distinct portrait, so no
// two profiles across Home / Discover / rails ever share a face. When the
// host count exceeds the pool size we fall back to a deterministic hash so
// behaviour stays stable.
import { DEMO_HOSTS } from "./demo-hosts";

const eliteMods = import.meta.glob("@/assets/elite/e*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const POOL: string[] = Object.entries(eliteMods)
  .map(([path, url]) => {
    const m = path.match(/\/e(\d+)\.jpg$/);
    return { i: m ? parseInt(m[1], 10) : 0, url };
  })
  .sort((a, b) => a.i - b.i)
  .map((x) => x.url);

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Build a stable id -> portrait-index map so every known demo host is
// guaranteed a unique portrait when the pool is large enough.
const ASSIGNMENT: Map<string, number> = (() => {
  const map = new Map<string, number>();
  const used = new Set<number>();
  const poolSize = POOL.length;
  DEMO_HOSTS.forEach((host, i) => {
    let idx: number;
    if (poolSize === 0) {
      idx = 0;
    } else if (i < poolSize) {
      // First pass: assign by natural order so unique for up to POOL.length hosts.
      idx = i;
    } else {
      // Overflow: hash + linear probe so it stays deterministic but spreads.
      idx = hash(host.id) % poolSize;
      let step = 0;
      while (used.has(idx) && step < poolSize) {
        idx = (idx + 1) % poolSize;
        step++;
      }
    }
    used.add(idx);
    map.set(host.id, idx);
  });
  return map;
})();

function portraitFor(id: string): string {
  if (POOL.length === 0) return "";
  const idx = ASSIGNMENT.get(id);
  if (idx !== undefined) return POOL[idx];
  return POOL[hash(id) % POOL.length];
}

/** Full-size portrait — use for hero / profile / large cards. */
export function hostAvatar(id: string): string {
  return portraitFor(id);
}

/** Portrait for card grid tiles. */
export function hostAvatarMed(id: string): string {
  return portraitFor(id);
}

/** Portrait for scroll-rail circles / chat lists. */
export function hostAvatarThumb(id: string): string {
  return portraitFor(id);
}

/** Total number of unique portraits available. */
export const HOST_AVATAR_COUNT = POOL.length;
