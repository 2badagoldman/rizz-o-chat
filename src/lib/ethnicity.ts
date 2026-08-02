import { supabase } from "@/integrations/supabase/client";

/**
 * Optional self-reported background collected at signup.
 * Used for two things only:
 *  - signup analytics (who is actually using Crush)
 *  - matching "live now" alerts to hosts with a similar heritage tag
 * Stored in `profile_demographics`, readable only by the member and admins.
 */
export const ETHNICITY_OPTIONS = [
  "Black",
  "Latina/Latino",
  "White",
  "Asian",
  "Middle Eastern",
  "Indigenous",
  "Mixed",
  "Prefer not to say",
] as const;

export type Ethnicity = (typeof ETHNICITY_OPTIONS)[number];

const PENDING_KEY = "crush:pendingEthnicity";

export function stashEthnicity(value: string | null) {
  try {
    if (value) localStorage.setItem(PENDING_KEY, value);
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}

/** Writes any signup-time choice to the account once a session exists. */
export async function syncPendingEthnicity(userId: string) {
  let pending: string | null = null;
  try {
    pending = localStorage.getItem(PENDING_KEY);
  } catch {
    return;
  }
  if (!pending) return;
  const { error } = await supabase
    .from("profile_demographics")
    .upsert({ user_id: userId, ethnicity: pending, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (!error) stashEthnicity(null);
}

export async function loadMyEthnicity(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profile_demographics")
    .select("ethnicity")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.ethnicity ?? null;
}
