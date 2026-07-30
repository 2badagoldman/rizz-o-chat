// Compliance guard for Welcome Showcase captions.
// Crush is a strictly non-sexual, PG-13 platform. Any caption that reads as
// flirty, suggestive or "unlock my private side" style is replaced with a
// friendly, conversation-first alternative before it can ever be rendered.

const BANNED = [
  "private side",
  "behind closed doors",
  "closed doors",
  "turn up the heat",
  "the heat",
  "spicy",
  "naughty",
  "tease",
  "teasing",
  "seduce",
  "seductive",
  "sexy",
  "sensual",
  "flirt",
  "flirty",
  "babe",
  "baby girl",
  "daddy",
  "undress",
  "lingerie",
  "bikini",
  "body",
  "curves",
  "bedroom",
  "in bed",
  "nsfw",
  "18+ content",
  "exclusive content",
  "unlock me",
  "unlock my",
  "keep up",
  "come closer",
  "whisper a secret",
  "just for my ears",
  "slide into",
  "after dark",
  "late night",
  "show off",
  "favorite girl",
  "your girl",
  "real fun",
  "dirty",
  "hot",
  "secret",
  "secrets",
  "in private",
  "if you dare",
  "closer",
  "peek",
  "sneak",
  "what you missed",
  "best line",
  "night lights",
  "hide",
  "shy",
  "spill",
  "catch my attention",
  "inner circle",
  "text me first",
  "impression",

];

const BANNED_EMOJI = ["💋", "😏", "🔥", "🌶️", "🍑", "🍆", "😈", "👅", "🥵", "💦", "🍸", "🥂", "😉", "🙈", "🍒", "💅", "🖤", "🎀"];

const SAFE_CAPTIONS = [
  "Say hi and start a real conversation 💬",
  "New here? Come meet the group ✨",
  "Good chats, good people — join in 🙌",
  "Tell me about your day ☀️",
  "Looking for someone to talk to? 💬",
  "Join the conversation, no pressure 🌿",
  "Friendly faces, real talk 💫",
  "Come say hello to the community 👋",
  "Chat about music, food, life 🎧",
  "Bring your questions, we'll bring the banter 😊",
  "Start with a hello — that's it 💬",
  "Meet people who actually reply ✨",
];

export function isCaptionCompliant(caption: string): boolean {
  const c = caption.toLowerCase();
  if (BANNED.some((w) => c.includes(w))) return false;
  if (BANNED_EMOJI.some((e) => caption.includes(e))) return false;
  return true;
}

/** Returns a compliant caption: the original if clean, otherwise a safe fallback. */
export function sanitizeShowcaseCaption(caption: string | null | undefined, seed?: string): string | null {
  const raw = (caption ?? "").trim();
  if (!raw) return null;
  if (isCaptionCompliant(raw)) return raw;
  const key = seed ?? raw;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return SAFE_CAPTIONS[h % SAFE_CAPTIONS.length];
}
