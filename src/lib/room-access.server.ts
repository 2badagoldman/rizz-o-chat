/**
 * Rooms are a paid feature: only Crush Gold / Crush Diamond subscribers can
 * join or post in a room. Hosts and admins always have access so they can run
 * their own rooms, and the 7-day chat trial does NOT unlock rooms.
 */
export const ROOMS_LOCKED_MESSAGE =
  "Rooms are for Crush Gold and Diamond members. Upgrade to join the conversation.";

export type RoomAccess = {
  allowed: boolean;
  reason: "subscription" | "host" | "admin" | "locked";
  tier: "free" | "plus" | "vip";
};

export async function evaluateRoomAccess(
  supabase: any,
  userId: string,
): Promise<RoomAccess> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_tier, account_type")
    .eq("id", userId)
    .maybeSingle();

  const tier = ((profile?.platform_tier as RoomAccess["tier"]) ?? "free");
  if (profile?.account_type === "host") return { allowed: true, reason: "host", tier };
  if (tier === "plus" || tier === "vip") return { allowed: true, reason: "subscription", tier };

  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" as const });
  if (isAdmin) return { allowed: true, reason: "admin", tier };

  return { allowed: false, reason: "locked", tier };
}

export async function assertRoomAccess(
  supabase: any,
  userId: string,
): Promise<RoomAccess> {
  const access = await evaluateRoomAccess(supabase, userId);
  if (!access.allowed) throw new Error(ROOMS_LOCKED_MESSAGE);
  return access;
}
