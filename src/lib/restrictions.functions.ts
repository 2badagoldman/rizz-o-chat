import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RestrictionState = {
  /** I (a host) have put this peer on my restricted list. */
  iRestrictPeer: boolean;
  /** This peer has restricted me — I cannot send photos or video to them. */
  peerRestrictsMe: boolean;
  reason: string | null;
};

/** Where both directions of the restriction between me and a peer stand. */
export const getRestrictionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { peerId?: string };
    if (!x?.peerId) throw new Error("peerId required");
    return { peerId: x.peerId };
  })
  .handler(async ({ data, context }): Promise<RestrictionState> => {
    const me = context.userId;
    const { data: rows } = await context.supabase
      .from("member_restrictions")
      .select("host_id, member_id, media_blocked, reason")
      .or(
        `and(host_id.eq.${me},member_id.eq.${data.peerId}),and(host_id.eq.${data.peerId},member_id.eq.${me})`,
      );
    const mine = (rows ?? []).find((r: any) => r.host_id === me);
    const theirs = (rows ?? []).find((r: any) => r.member_id === me);
    return {
      iRestrictPeer: !!mine,
      peerRestrictsMe: !!theirs && theirs.media_blocked !== false,
      reason: (mine?.reason as string) ?? null,
    };
  });

/** Add or remove a member from my restricted group. */
export const setRestriction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { memberId?: string; restricted?: boolean; reason?: string };
    if (!x?.memberId) throw new Error("memberId required");
    const reason = (x.reason ?? "").trim().slice(0, 500);
    return { memberId: x.memberId, restricted: x.restricted !== false, reason: reason || null };
  })
  .handler(async ({ data, context }) => {
    if (data.memberId === context.userId) throw new Error("You can't restrict yourself.");
    if (!data.restricted) {
      const { error } = await context.supabase
        .from("member_restrictions")
        .delete()
        .eq("host_id", context.userId)
        .eq("member_id", data.memberId);
      if (error) throw error;
      return { restricted: false };
    }
    const { error } = await context.supabase
      .from("member_restrictions")
      .upsert(
        { host_id: context.userId, member_id: data.memberId, media_blocked: true, reason: data.reason },
        { onConflict: "host_id,member_id" },
      );
    if (error) throw error;
    return { restricted: true };
  });

/** Everyone currently in my restricted group. */
export const listRestricted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("member_restrictions")
      .select("member_id, reason, created_at")
      .eq("host_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const ids = (rows ?? []).map((r: any) => r.member_id);
    if (!ids.length) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ids);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({
      memberId: r.member_id,
      reason: r.reason as string | null,
      createdAt: r.created_at as string,
      profile: byId.get(r.member_id) ?? null,
    }));
  });
