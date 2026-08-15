/**
 * The landing-page "taste it" chat is stored locally so that when the visitor
 * joins, the exact conversation they already started shows up in their chat log
 * and they can keep going where they left off.
 */
export type TasteTranscript = {
  hostId: string;
  /** AI SDK UIMessage[] — stored verbatim so the chat route can adopt them. */
  messages: unknown[];
  at: number;
};

const KEY = "crush:taste-chat";
/** Transcript is only worth restoring for a day. */
const TTL_MS = 24 * 60 * 60 * 1000;

export function saveTasteTranscript(hostId: string, messages: unknown[]) {
  if (typeof window === "undefined" || !messages.length) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ hostId, messages, at: Date.now() } satisfies TasteTranscript));
  } catch { /* storage full / disabled */ }
}

export function readTasteTranscript(): TasteTranscript | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as TasteTranscript;
    if (!t?.hostId || !Array.isArray(t.messages) || !t.messages.length) return null;
    if (Date.now() - Number(t.at ?? 0) > TTL_MS) { clearTasteTranscript(); return null; }
    return t;
  } catch { return null; }
}

export function clearTasteTranscript() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
