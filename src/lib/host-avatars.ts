// Portrait pool used as placeholder covers for demo hosts.
// Pool = 9 local stylized AI portraits + 100 women portraits from randomuser.me.
// Deterministically mapped by host id so each host always shows the same face.
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

// randomuser.me: women only. Full ~256px, thumb ~80px. No mid tier exists,
// so med reuses full (already small).
const REMOTE_COUNT = 100;
const womenFull = (i: number) => `https://randomuser.me/api/portraits/women/${i}.jpg`;
const womenThumb = (i: number) => `https://randomuser.me/api/portraits/thumb/women/${i}.jpg`;

const POOL_FULL: string[] = [
  ...LOCAL,
  ...Array.from({ length: REMOTE_COUNT }, (_, i) => womenFull(i)),
];
const POOL_MED: string[] = [
  ...LOCAL,
  ...Array.from({ length: REMOTE_COUNT }, (_, i) => womenFull(i)),
];
const POOL_THUMB: string[] = [
  ...LOCAL,
  ...Array.from({ length: REMOTE_COUNT }, (_, i) => womenThumb(i)),
];


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

/** ~64px portrait — use for scroll-rail circles / chat lists. */
export function hostAvatarThumb(id: string): string {
  return POOL_THUMB[hash(id) % POOL_THUMB.length];
}

/** Total number of unique portraits available. */
export const HOST_AVATAR_COUNT = POOL_FULL.length;

