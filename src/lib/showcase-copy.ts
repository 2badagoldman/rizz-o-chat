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
  "I'm here, I'm listening. What's on your mind? 💬",
  "Coffee's brewing — come tell me something good ☕",
  "Best conversation of your night starts with hi 💫",
  "Fair warning: I actually reply, and fast ⚡",
  "Golden hour and good company — join me ✨",
  "Tell me the story you never get to tell 🌙",
  "Come as you are. Stay for the conversation 🤍",
  "Some people scroll. You could be talking to me 💬",
  "The first message is the hardest — I'll make it easy 🌸",
  "Ask me anything, I promise you a real answer ✨",
  "Long talks, late laughs, zero pressure 🌿",
  "Your day sounds interesting. Prove me right ☀️",
  "I'd rather know you than know of you 💫",
  "Two words: say hi. I'll take it from there 💬",
  "Room for one more good conversation tonight 🌙",
  "Real talk, real laughs, real me 🤍",
  "Bring the energy — I'll match it ⚡",
  "Somewhere between hello and 3am conversations 🌙",
  "Come find out what I'm actually like ✨",
  "Music, food, ridiculous opinions — let's go 🎧",
  "I like people who go first. Be that person 💬",
  "You've made it this far. Might as well say hi 😊",
  "Genuine, curious, a little too honest 🌸",
  "Let's skip the small talk and get to the good part 💫",
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
