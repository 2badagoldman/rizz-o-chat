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

const DEFAULT_VOICE: CreatorVoice = {
  voice: "shimmer",
  instructions:
    "Speak like a warm, playful woman sending a quick voice note to someone she likes. Casual, unhurried, a little smiley. Never announce yourself, never sound like an assistant or a narrator.",
};

const VOICES: Record<string, CreatorVoice> = {
  "demo-jen": {
    voice: "shimmer",
    instructions:
      "Warm Chicago friend energy: quick, gently teasing, a soft laugh in the voice. Short and casual, like a voice note tapped out while walking the dog.",
  },
  "demo-aria": {
    voice: "coral",
    instructions:
      "Sunny Miami warmth, a little dreamy and golden-hour slow. Soft smile in the voice, relaxed pacing, never breathy or performative.",
  },
  "demo-rubi": {
    voice: "sage",
    instructions:
      "Austin warmth with dry wit. Low, easy, slightly amused delivery — like she's half smiling at her own joke.",
  },
  "demo-wonderwoman": {
    voice: "nova",
    instructions:
      "Confident and playful, bright but grounded. Speaks like she's genuinely curious about the person she's replying to.",
  },
};

/** Stable per-creator voice; unknown ids fall back to a warm default. */
export function creatorVoice(hostId: string | undefined | null): CreatorVoice {
  if (!hostId) return DEFAULT_VOICE;
  return VOICES[hostId] ?? DEFAULT_VOICE;
}

/** Longest text we will ever synthesize for one voice note. */
export const MAX_TTS_CHARS = 600;
