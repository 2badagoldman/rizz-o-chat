/**
 * Voice identities for AI creators.
 *
 * Voice notes are the signature Crush feature — hearing her actually say your
 * name is worth more than a hundred text replies. Each creator gets a stable
 * voice + delivery style so she sounds like the same person every time.
 */

export type CreatorVoice = {
  /** OpenAI TTS voice name. */
  voice: string;
  /** Natural-language delivery direction passed as `instructions`. */
  instructions: string;
};

const FEMININE = "Distinctly feminine voice with a natural American accent — warm, higher register, never flat, never robotic, never masculine.";

const DEFAULT_VOICE: CreatorVoice = {
  voice: "shimmer",
  instructions: `${FEMININE} Speak like a playful woman sending a quick voice note to someone she likes: casual, unhurried, a little smiley. Land his name softly when it appears. Never announce yourself, never sound like an assistant or a narrator.`,
};

const VOICES: Record<string, CreatorVoice> = {
  "demo-jen": {
    voice: "shimmer",
    instructions: `${FEMININE} Warm Chicago-girl energy: quick, gently teasing, a soft laugh in the voice. Short and casual, like a voice note tapped out while walking the dog. Say his name like she's already smiling.`,
  },
  "demo-aria": {
    voice: "coral",
    instructions: `${FEMININE} Sunny Miami warmth, a little dreamy and golden-hour slow. Soft smile in the voice, relaxed pacing, never breathy or performative. Lean into his name.`,
  },
  "demo-rubi": {
    voice: "nova",
    instructions: `${FEMININE} Feminine American girl-next-door with Austin warmth and dry wit — bright, easy, slightly amused, like she's half smiling at her own joke. Say his name low and close, like she's leaning into the mic.`,
  },
  "demo-wonderwoman": {
    voice: "sage",
    instructions: `${FEMININE} Confident and playful, bright but grounded, unmistakably a woman. Speaks like she's genuinely curious about the person she's replying to, with a teasing lift at the end of her lines.`,
  },
};

/**
 * Turns a plain text reply into something worth pressing play on.
 *
 * A flat read of the same words is boring — a voice note should open with his
 * name, feel spoken (not read), and end with a hook that makes replying the
 * obvious next move.
 */
export function voiceNoteScript(
  text: string,
  opts?: { name?: string | null; creatorName?: string },
): string {
  const body = text.replace(/\s+/g, " ").trim();
  if (!body) return body;
  const name = (opts?.name ?? "").trim().split(/\s+/)[0];
  const openers = name
    ? [`Okay ${name}, listen…`, `Hey ${name} —`, `${name}. Real quick…`, `Mmm, ${name}…`]
    : ["Okay, listen…", "Hey you —", "Real quick…", "Mmm, okay…"];
  const closers = name
    ? [`Say something back, ${name}.`, `Your turn, ${name}.`, `Don't leave me on read, ${name}.`]
    : ["Say something back.", "Your turn.", "Don't leave me on read."];
  // Deterministic per message so replaying the same note sounds the same.
  let h = 0;
  for (let i = 0; i < body.length; i++) h = (h * 31 + body.charCodeAt(i)) >>> 0;
  const opener = openers[h % openers.length];
  const closer = closers[(h >> 3) % closers.length];
  const script = `${opener} ${body}`;
  return /[.!?]$/.test(script) ? `${script} ${closer}` : `${script}. ${closer}`;
}

/** Stable per-creator voice; unknown ids fall back to a warm default. */
export function creatorVoice(hostId: string | undefined | null): CreatorVoice {
  if (!hostId) return DEFAULT_VOICE;
  return VOICES[hostId] ?? DEFAULT_VOICE;
}

/** Longest text we will ever synthesize for one voice note. */
export const MAX_TTS_CHARS = 600;
