/**
 * Lightweight "she remembers you" store.
 *
 * Crush sells the feeling of being seen, so every AI creator needs to know who
 * she is talking to and what he already told her. We keep a small set of facts
 * on the device (no account required) and hand them to the model as notes, so
 * she can call him by name and bring things back later ("did that shift go ok?").
 */
export type MemberMemory = {
  name: string;
  /**
   * True only when the member explicitly gave the name (typed it in the name
   * field, or said "my name is …"). We never speak a name we merely guessed.
   */
  nameConfirmed: boolean;
  /** Short free-text facts, newest last. Capped so prompts stay small. */
  facts: string[];
  at: number;
};

const KEY = "crush:member-memory";
const MAX_FACTS = 14;
const MAX_FACT_LEN = 140;

function empty(): MemberMemory {
  return { name: "", nameConfirmed: false, facts: [], at: Date.now() };
}

export function readMemberMemory(): MemberMemory {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const m = JSON.parse(raw) as MemberMemory;
    return {
      name: typeof m?.name === "string" ? m.name : "",
      nameConfirmed: m?.nameConfirmed === true,
      facts: Array.isArray(m?.facts) ? m.facts.filter((f) => typeof f === "string").slice(-MAX_FACTS) : [],
      at: Number(m?.at ?? Date.now()),
    };
  } catch {
    return empty();
  }
}

function write(m: MemberMemory) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...m, facts: m.facts.slice(-MAX_FACTS), at: Date.now() }));
  } catch {
    /* storage disabled */
  }
}

/** Only call this with a name the member actually gave us. */
export function saveMemberName(name: string) {
  const clean = name.replace(/[^\p{L}\p{N}' -]/gu, "").trim().slice(0, 24);
  const m = readMemberMemory();
  write({ ...m, name: clean, nameConfirmed: clean.length > 0 });
}

/** The name we're allowed to say out loud — empty unless he confirmed it. */
export function confirmedMemberName(): string {
  const m = readMemberMemory();
  return m.nameConfirmed ? m.name : "";
}


export function addMemberFact(fact: string) {
  const clean = fact.replace(/\s+/g, " ").trim().slice(0, MAX_FACT_LEN);
  if (clean.length < 4) return;
  const m = readMemberMemory();
  if (m.facts.some((f) => f.toLowerCase() === clean.toLowerCase())) return;
  write({ ...m, facts: [...m.facts, clean] });
}

/** Patterns that reliably mark something worth remembering about him. */
const FACT_CUES: RegExp[] = [
  /\bi(?:'m| am)\s+(?:a|an|the)\s+[^.!?]{2,60}/i,
  /\bi\s+(?:work|study|live|grew up|train|play|drive|teach|code|cook)\b[^.!?]{0,60}/i,
  /\bi\s+(?:have|got)\s+(?:a|an|two|three|\d+)\s+[^.!?]{2,60}/i,
  /\bmy\s+(?:job|shift|dog|cat|kid|kids|son|daughter|mom|dad|brother|sister|birthday|team|car|band|gym|boss|ex)\b[^.!?]{0,60}/i,
  /\bi(?:'m| am)\s+(?:stressed|tired|nervous|excited|lonely|anxious|happy|sad|broke|busy|off|working)\b[^.!?]{0,60}/i,
  /\bi\s+(?:love|like|hate|miss|want|need)\s+[^.!?]{2,60}/i,
  /\b(?:tomorrow|tonight|this weekend|next week)\b[^.!?]{0,60}/i,
];

const NAME_CUES: RegExp[] = [
  /\bmy name(?:'s| is)\s+([\p{L}][\p{L}'-]{1,23})/iu,
  /\b(?:i'm|i am|it's|its|call me|this is)\s+([\p{L}][\p{L}'-]{1,23})\s*$/iu,
];

const NAME_STOPWORDS = new Set([
  "good", "fine", "ok", "okay", "here", "back", "tired", "bored", "sorry", "not",
  "just", "still", "down", "up", "great", "cool", "single", "new", "hi", "hey",
]);

/** Pull a name + notable facts out of what he just typed. Returns the new name if found. */
export function rememberFromMessage(text: string): { name?: string } {
  const t = text.trim();
  if (!t) return {};
  let found: string | undefined;

  for (const re of NAME_CUES) {
    const m = t.match(re);
    const candidate = m?.[1]?.trim();
    if (candidate && !NAME_STOPWORDS.has(candidate.toLowerCase())) {
      found = candidate.slice(0, 24);
      saveMemberName(found);
      break;
    }
  }

  for (const re of FACT_CUES) {
    const m = t.match(re);
    if (m?.[0]) addMemberFact(m[0]);
  }

  return found ? { name: found } : {};
}

/** Compact note block handed to the model. Empty string when we know nothing yet. */
export function memberNotes(): string {
  const m = readMemberMemory();
  if (!m.facts.length) return "";
  return m.facts.slice(-MAX_FACTS).map((f) => `- ${f}`).join("\n");
}

export function clearMemberMemory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
