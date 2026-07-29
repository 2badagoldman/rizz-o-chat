// Shared client-safe constants for the guest (no-account) subscription flow.
export const GUEST_CODE_STORAGE_KEY = 'crush:guestSubscriptionCode';
export const GUEST_PLAN_IDS = ['rizz_gold_weekly', 'rizz_diamond_weekly'] as const;

export function isGuestPlan(priceId: string) {
  return (GUEST_PLAN_IDS as readonly string[]).includes(priceId);
}

export function rememberGuestCode(code: string) {
  try {
    localStorage.setItem(GUEST_CODE_STORAGE_KEY, code);
  } catch {
    /* storage unavailable */
  }
}

export function readGuestCode(): string | null {
  try {
    return localStorage.getItem(GUEST_CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearGuestCode() {
  try {
    localStorage.removeItem(GUEST_CODE_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
