// Portrait pool for demo hosts — elite editorial-grade AI portraits only.
// All images bundled locally in src/assets/elite/ (offline, CDN-free, Vite
// fingerprints & long-caches). Deterministically mapped by host id so each
// host always shows the same face across renders.
const eliteMods = import.meta.glob("@/assets/elite/e*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const ELITE: string[] = Object.entries(eliteMods)
  .map(([path, url]) => {
    const m = path.match(/\/e(\d+)\.jpg$/);
    return { i: m ? parseInt(m[1], 10) : 0, url };
  })
  .sort((a, b) => a.i - b.i)
  .map((x) => x.url);

const POOL_FULL: string[] = ELITE;
const POOL_MED: string[] = ELITE;
const POOL_THUMB: string[] = ELITE;

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Full-size portrait — use for hero / profile / large cards. */
export function hostAvatar(id: string): string {
  return POOL_FULL[hash(id) % POOL_FULL.length];
}

/** Portrait for card grid tiles. */
export function hostAvatarMed(id: string): string {
  return POOL_MED[hash(id) % POOL_MED.length];
}

/** Portrait for scroll-rail circles / chat lists. */
export function hostAvatarThumb(id: string): string {
  return POOL_THUMB[hash(id) % POOL_THUMB.length];
}

/** Total number of unique portraits available. */
export const HOST_AVATAR_COUNT = POOL_FULL.length;
