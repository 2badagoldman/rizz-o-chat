// Shared store for creators a member swiped right on ("prospects you like").
// Persisted in localStorage so the Chats page can surface them instantly.
export const LIKES_KEY = "crush.swipe.likes";
export const PASS_KEY = "crush.swipe.passes";
const EVENT = "crush:swipe-likes";

export function readIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeIds(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids.slice(-500)));
  } catch {
    /* storage unavailable — swiping still works for the session */
  }
  if (key === LIKES_KEY && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function readLikes(): string[] {
  return readIds(LIKES_KEY);
}

export function removeLike(id: string) {
  writeIds(
    LIKES_KEY,
    readIds(LIKES_KEY).filter((x) => x !== id),
  );
}

export function subscribeLikes(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}
