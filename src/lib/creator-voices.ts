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

const FEMININE =
  "Clearly feminine adult woman's voice — light, higher register, soft and airy on the consonants. Professional, composed and polished, never deep, never husky, never masculine, never robotic. Relaxed pace, gentle downward endings, low volume as if speaking close to the mic.";

const AMERICAN = "Neutral American accent (well-spoken, west-coast neutral).";
const BRITISH = "Soft southern-English British accent (refined RP-adjacent, never theatrical).";

const DEFAULT_VOICE: CreatorVoice = {
  voice: "shimmer",
  instructions: `${FEMININE} ${AMERICAN} Speak like a poised woman leaving a short, friendly voice note: unhurried, warm, quietly confident. Say his name gently when it appears. Never announce yourself, never sound like an assistant or a narrator.`,
};

const VOICES: Record<string, CreatorVoice> = {
  "demo-jen": {
    voice: "shimmer",
    instructions: `${FEMININE} ${AMERICAN} Friendly and softly upbeat with a light smile in the voice. Short, easy phrasing, like a quick note between errands. Keep it gentle and understated rather than bubbly.`,
  },
  "demo-aria": {
    voice: "coral",
    instructions: `${FEMININE} ${AMERICAN} Calm, sunlit warmth with slow, graceful pacing. Softly spoken, smooth and even, never breathy or performative.`,
  },
  "demo-rubi": {
    voice: "nova",
    instructions: `${FEMININE} ${AMERICAN} Bright girl-next-door softness with a light, dry humour underneath. Easy, conversational, gently amused — kept quiet and close to the mic.`,
  },
  "demo-wonderwoman": {
    voice: "sage",
    instructions: `${FEMININE} ${BRITISH} Elegant, softly spoken and self-assured, with a light lift at the end of her lines. Warm and genuinely curious, never commanding or booming.`,
  },
  "demo-lena": {
    voice: "shimmer",
    instructions: `${FEMININE} ${BRITISH} Understated, articulate and quietly graceful. Measured pacing, precise diction, softened edges — like a thoughtful woman speaking low in a quiet room.`,
  },
};

/**
 * Turns a plain text reply into something worth pressing play on.
 *
 * A flat read of the same words is boring — a voice note should open warmly,
 * feel spoken (not read), and end with an easy, pressure-free invitation to
 * reply. Never guilt-trip or plead.
 */
export function voiceNoteScript(
  text: string,
  opts?: { name?: string | null; creatorName?: string },
): string {
  const body = text.replace(/\s+/g, " ").trim();
  if (!body) return body;
  const name = (opts?.name ?? "").trim().split(/\s+/)[0];
  const openers = name
    ? [`Hey ${name} —`, `Hi ${name},`, `${name}, quick one…`, `Okay ${name},`]
    : ["Hey you —", "Hi there,", "Quick one…", "Okay, so…"];
  const closers = name
    ? [`Talk soon, ${name}.`, `Let me know, ${name}.`, `Whenever you're free, ${name}.`]
    : ["Talk soon.", "Let me know.", "Whenever you're free."];
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
