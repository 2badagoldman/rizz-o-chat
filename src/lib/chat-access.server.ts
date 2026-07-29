/**
 * Chat trial policy: every new account gets 7 days of free chatting
 * (member -> host and member -> member). After that a Crush Gold or
 * Crush Diamond subscription is required to keep sending messages.
 *
 * Hosts and admins are never gated — they must be able to reply.
 */
export const CHAT_TRIAL_DAYS = 7;

export type ChatAccess = {
  allowed: boolean;
  /** "trial" | "subscription" | "host" | "expired" */
  reason: "trial" | "subscription" | "host" | "expired";
  tier: "free" | "plus" | "vip";
  trialEndsAt: string | null;
  daysLeft: number;
};

export async function evaluateChatAccess(userId: string): Promise<ChatAccess> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("created_at, platform_tier, account_type")
    .eq("id", userId)
    .maybeSingle();

  const tier = ((profile?.platform_tier as ChatAccess["tier"]) ?? "free");
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const trialEnd = new Date(createdAt.getTime() + CHAT_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const msLeft = trialEnd.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

  if (profile?.account_type === "host") {
    return { allowed: true, reason: "host", tier, trialEndsAt: null, daysLeft: 0 };
  }
  if (tier === "plus" || tier === "vip") {
    return { allowed: true, reason: "subscription", tier, trialEndsAt: trialEnd.toISOString(), daysLeft };
  }
  if (msLeft > 0) {
    return { allowed: true, reason: "trial", tier, trialEndsAt: trialEnd.toISOString(), daysLeft };
  }
  return { allowed: false, reason: "expired", tier, trialEndsAt: trialEnd.toISOString(), daysLeft: 0 };
}

export const CHAT_LOCKED_MESSAGE =
  "Your 7-day free chat trial has ended. Upgrade to Crush Gold to keep chatting.";
