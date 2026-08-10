/**
 * Demo stories for the AI co-hosts so the rail always looks alive.
 * These are client-side only (no DB rows) — ids are prefixed with `demo-story-`
 * so the rail knows to skip server calls (views, delete, viewers).
 */
import { AI_HOST_IDS, DEMO_HOSTS } from "./demo-hosts";
import { hostAvatarMed } from "./host-avatars";
import type { StoryGroup, StoryKind, StoryRow } from "./stories";

export const DEMO_STORY_PREFIX = "demo-story-";

export function isDemoStoryId(id: string) {
  return id.startsWith(DEMO_STORY_PREFIX);
}

type Beat = { kind: StoryKind; caption: string; accent?: string; coins?: number; minutesAgo: number };

const BEATS: Record<string, Beat[]> = {
  "demo-aria": [
    { kind: "media", caption: "Golden hour walk 🌅", minutesAgo: 42 },
    { kind: "text", caption: "Who's up? Say something interesting.", accent: "rose", minutesAgo: 96 },
  ],
  "demo-jen": [
    { kind: "media", caption: "New fit, thoughts?", minutesAgo: 18 },
    { kind: "coins", caption: "Someone just sent a gift — thank you! 😊", coins: 250, accent: "gold", minutesAgo: 130 },
  ],
  "demo-lena": [
    { kind: "text", caption: "Room's open tonight — pull up.", accent: "violet", minutesAgo: 55 },
    { kind: "media", caption: "Studio day ✨", minutesAgo: 210 },
  ],
  "demo-jade": [
    { kind: "media", caption: "Coffee then chaos ☕️", minutesAgo: 9 },
    { kind: "gift", caption: "Thank you for the gift 💐", accent: "rose", minutesAgo: 300 },
  ],
  "demo-remy": [
    { kind: "text", caption: "Ask me anything for the next hour.", accent: "mint", minutesAgo: 33 },
  ],
  "demo-harper": [
    { kind: "media", caption: "Beach reset 🌊", minutesAgo: 74 },
    { kind: "coins", caption: "Most talkative friend this week gets a voice note", coins: 500, accent: "gold", minutesAgo: 260 },
  ],
  "demo-cleo": [
    { kind: "media", caption: "Evening in, good playlist", minutesAgo: 21 },
    { kind: "text", caption: "Co-hosting the lounge in 10 mins.", accent: "sea", minutesAgo: 150 },
  ],
  "demo-yuna": [
    { kind: "media", caption: "Soft day 🤍", minutesAgo: 61 },
  ],
};

/** Filler beats so every available profile always has at least 3 stories. */
const FILLER: Beat[] = [
  { kind: "media", caption: "Today's look 💫", minutesAgo: 26 },
  { kind: "text", caption: "Online now — come say hi.", accent: "sea", minutesAgo: 88 },
  { kind: "coins", caption: "Say hi and I'll reply first 😊", coins: 100, accent: "gold", minutesAgo: 170 },
  { kind: "gift", caption: "Thank you for the gift 💐", accent: "rose", minutesAgo: 240 },
  { kind: "text", caption: "Ask me anything for the next hour.", accent: "violet", minutesAgo: 320 },
];

const MIN_STORIES = 3;

/** Build story groups for every online/available demo profile. */
export function buildDemoStoryGroups(): StoryGroup[] {
  const now = Date.now();
  const groups: StoryGroup[] = [];

  const creators = DEMO_HOSTS.filter((h) => h.online || (AI_HOST_IDS as readonly string[]).includes(h.id));

  for (const creator of creators) {
    const id = creator.id;
    const beats = [...(BEATS[id] ?? [])];
    // Everyone keeps at least 3 viewable stories so the rail never looks dead.
    let f = 0;
    while (beats.length < MIN_STORIES) {
      const base = FILLER[(f + id.length) % FILLER.length];
      beats.push({ ...base, minutesAgo: base.minutesAgo + f * 17 });
      f++;
    }

    const avatar = hostAvatarMed(id);
    const stories: StoryRow[] = beats.map((b, i) => {
      const created = new Date(now - b.minutesAgo * 60_000).toISOString();
      return {
        id: `${DEMO_STORY_PREFIX}${id}-${i}`,
        author_id: id,
        kind: b.kind,
        media_path: b.kind === "media" ? avatar : null,
        media_type: b.kind === "media" ? "image" : null,
        caption: b.caption,
        accent: b.accent ?? "sea",
        coin_value: b.coins ?? null,
        created_at: created,
        expires_at: new Date(now + 12 * 3600_000).toISOString(),
        seen: false,
        view_count: 0,
      };
    });

    groups.push({
      author_id: id,
      display_name: creator.name,
      avatar_url: avatar,
      stories,
      allSeen: false,
    });
  }

  return groups;
}


export function shuffleGroups<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
