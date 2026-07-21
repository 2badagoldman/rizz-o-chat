// Portrait pool used as placeholder covers for demo hosts.
// All images are bundled locally (offline-first, no external CDN pulls):
//   • 9 stylized AI portraits in src/assets/ai-portrait-*.jpg
//   • 100 women portraits in src/assets/hosts/w{0..99}.jpg (128px full/med)
//     with matching thumbs in src/assets/hosts/t{0..99}.jpg (48px)
// Vite fingerprints and long-caches all of them; the browser never talks to
// randomuser.me at runtime.
import p1 from "@/assets/ai-portrait-1.jpg";
import p3 from "@/assets/ai-portrait-3.jpg";
import p4 from "@/assets/ai-portrait-4.jpg";
import p6 from "@/assets/ai-portrait-6.jpg";
import p7 from "@/assets/ai-portrait-7.jpg";
import p8 from "@/assets/ai-portrait-8.jpg";
import p9 from "@/assets/ai-portrait-9.jpg";
import p11 from "@/assets/ai-portrait-11.jpg";
import p12 from "@/assets/ai-portrait-12.jpg";

const LOCAL: string[] = [p1, p3, p4, p6, p7, p8, p9, p11, p12];

// Eagerly import all bundled women portraits as URL strings.
const fullMods = import.meta.glob("@/assets/hosts/w*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const thumbMods = import.meta.glob("@/assets/hosts/t*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function sortByIndex(mods: Record<string, string>): string[] {
  return Object.entries(mods)
    .map(([path, url]) => {
      const m = path.match(/\/[wt](\d+)\.jpg$/);
      return { i: m ? parseInt(m[1], 10) : 0, url };
    })
    .sort((a, b) => a.i - b.i)
    .map((x) => x.url);
}

const WOMEN_FULL = sortByIndex(fullMods);
const WOMEN_THUMB = sortByIndex(thumbMods);

const POOL_FULL: string[] = [...LOCAL, ...WOMEN_FULL];
const POOL_MED: string[] = [...LOCAL, ...WOMEN_FULL];
const POOL_THUMB: string[] = [...LOCAL, ...WOMEN_THUMB];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Full-size portrait — use for hero / profile / large cards. */
export function hostAvatar(id: string): string {
  return POOL_FULL[hash(id) % POOL_FULL.length];
}

/** ~128px portrait — use for card grid tiles. */
export function hostAvatarMed(id: string): string {
  return POOL_MED[hash(id) % POOL_MED.length];
}

/** ~48px portrait — use for scroll-rail circles / chat lists. */
export function hostAvatarThumb(id: string): string {
  return POOL_THUMB[hash(id) % POOL_THUMB.length];
}

/** Total number of unique portraits available. */
export const HOST_AVATAR_COUNT = POOL_FULL.length;
