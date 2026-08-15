// Creator compensation tiers — single source of truth for the app.
// 0-99 active friends: 35% · 100-499: 50% · 500+: 65%
export const EARNING_TIERS = [
  { min: 0, pct: 35, label: "0 – 99 subscribers" },
  { min: 100, pct: 50, label: "100 – 499 subscribers" },
  { min: 500, pct: 65, label: "500+ subscribers" },
] as const;

export function splitPctFor(activeFriends: number): number {
  if (activeFriends >= 500) return 65;
  if (activeFriends >= 100) return 50;
  return 35;
}

/** Friends still needed to reach the next tier (0 when already at the top). */
export function friendsToNextTier(activeFriends: number): number {
  if (activeFriends >= 500) return 0;
  if (activeFriends >= 100) return 500 - activeFriends;
  return 100 - activeFriends;
}

export function nextTierPct(activeFriends: number): number | null {
  if (activeFriends >= 500) return null;
  return activeFriends >= 100 ? 65 : 50;
}

/** Target subscriber count of the next tier (null when maxed). */
export function nextTierTarget(activeFriends: number): number | null {
  if (activeFriends >= 500) return null;
  return activeFriends >= 100 ? 500 : 100;
}
