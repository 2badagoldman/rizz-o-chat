/** Shared (client-safe) types + helpers for the Stories feature. */

export type StoryKind = "media" | "gift" | "coins" | "text";

export type StoryRow = {
  id: string;
  author_id: string;
  kind: StoryKind;
  media_path: string | null;
  media_type: string | null;
  caption: string | null;
  accent: string | null;
  coin_value: number | null;
  created_at: string;
  expires_at: string;
  seen: boolean;
  view_count: number;
};

export type StoryGroup = {
  author_id: string;
  display_name: string;
  avatar_url: string | null;
  stories: StoryRow[];
  allSeen: boolean;
};

export const STORY_MEDIA_BUCKET = "profile-media";
export const MAX_STORY_BYTES = 50 * 1024 * 1024;

export const STORY_ACCENTS = [
  { id: "sea", label: "Sea", css: "linear-gradient(160deg,#0ea5e9,#1e3a8a)" },
  { id: "rose", label: "Rose", css: "linear-gradient(160deg,#fb7185,#be123c)" },
  { id: "gold", label: "Gold", css: "linear-gradient(160deg,#fbbf24,#b45309)" },
  { id: "mint", label: "Mint", css: "linear-gradient(160deg,#34d399,#065f46)" },
  { id: "violet", label: "Violet", css: "linear-gradient(160deg,#a78bfa,#4c1d95)" },
] as const;

export function accentCss(accent: string | null | undefined) {
  return STORY_ACCENTS.find((a) => a.id === accent)?.css ?? STORY_ACCENTS[0].css;
}

export function storyMediaPath(userId: string, file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  return `${userId}/stories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
}

export function storyKindForFile(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}
