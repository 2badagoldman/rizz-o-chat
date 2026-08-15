/**
 * The visitor's first name, captured on the landing chat.
 *
 * Hearing a creator say your actual name is the whole hook of Crush, so the
 * name is kept locally (no account needed) and reused everywhere she speaks.
 */
const KEY = "crush:visitor-name";

export function readVisitorName(): string {
  if (typeof window === "undefined") return "";
  try {
    return (localStorage.getItem(KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function saveVisitorName(name: string) {
  if (typeof window === "undefined") return;
  const clean = name.replace(/[^\p{L}\p{N}' -]/gu, "").trim().slice(0, 24);
  try {
    if (clean) localStorage.setItem(KEY, clean);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage disabled */
  }
}
