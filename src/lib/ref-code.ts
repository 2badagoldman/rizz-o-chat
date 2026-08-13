// Creator promo-code attribution (Step 4 of the outreach playbook).
// A creator shares crush.link/r/<CODE>; we remember the code on the device so
// the eventual signup, install and subscription all roll up to that creator.
const REF_KEY = "rizzla:ref";
const REF_SOURCE_KEY = "rizzla:ref_src";

export function saveRefCode(code: string, source?: string) {
  if (typeof window === "undefined") return;
  const clean = (code ?? "").trim().toUpperCase().slice(0, 32);
  if (!clean) return;
  try {
    // First touch wins — the creator who actually drove the download gets credit.
    if (!localStorage.getItem(REF_KEY)) {
      localStorage.setItem(REF_KEY, clean);
      if (source) localStorage.setItem(REF_SOURCE_KEY, source.slice(0, 40));
    }
  } catch {}
}

export function getRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export function getRefSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_SOURCE_KEY);
  } catch {
    return null;
  }
}
