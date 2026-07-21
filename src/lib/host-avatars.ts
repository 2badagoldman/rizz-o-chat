// Portrait pool used as placeholder covers for demo hosts.
// Once a real user signs up and uploads their own avatar / media, that
// takes over automatically — these only render for the seeded demo pool.
//
// Pool = 9 local stylized AI portraits + 100 curated real portraits from
// randomuser.me (a free, stable CDN of Creative Commons headshots).
// Deterministically mapped by host id so each host always shows the same
// face across renders, but the wider pool eliminates the "same 9 faces"
// feeling on Home and Discover.
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

// 100 curated female headshots (0.jpg – 99.jpg). Stable CDN URLs.
const REMOTE: string[] = Array.from(
  { length: 100 },
  (_, i) => `https://randomuser.me/api/portraits/women/${i}.jpg`,
);

const POOL: string[] = [...LOCAL, ...REMOTE];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function hostAvatar(id: string): string {
  return POOL[hash(id) % POOL.length];
}

/** Total number of unique portraits available. */
export const HOST_AVATAR_COUNT = POOL.length;
