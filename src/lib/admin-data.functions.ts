import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const listAllHosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { status?: string; q?: string };
    return { status: x.status ?? "all", q: (x.q ?? "").trim().toLowerCase() };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, verification_status, gender, platform_tier, created_at, bio")
      .eq("account_type", "host")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status !== "all") q = q.eq("verification_status", data.status as "pending" | "verified" | "rejected");
    const { data: hosts, error } = await q;
    if (error) throw error;

    const ids = (hosts ?? []).map((h: any) => h.id);
    let lists: any[] = [];
    if (ids.length > 0) {
      const r = await context.supabase
        .from("friends_lists")
        .select("id, host_id, price_cents, subscriber_count, active, title")
        .in("host_id", ids);
      lists = r.data ?? [];
    }
    const byHost = new Map(lists.map((l) => [l.host_id, l]));
    let rows = (hosts ?? []).map((h: any) => ({ ...h, list: byHost.get(h.id) ?? null }));
    if (data.q) {
      rows = rows.filter((r: any) =>
        (r.display_name ?? "").toLowerCase().includes(data.q),
      );
    }
    return rows;
  });

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { q?: string; account_type?: string; limit?: number };
    return {
      q: (x.q ?? "").trim(),
      account_type: x.account_type ?? "all",
      limit: Math.min(Math.max(x.limit ?? 50, 1), 200),
    };
  })
  .handler(async ({ data, context }) => {
    // Admins can search everyone; non-admin callers get a search restricted to hosts.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    let q = context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, account_type, verification_status, gender, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (!isAdmin) q = q.eq("account_type", "host");
    else if (data.account_type !== "all") q = q.eq("account_type", data.account_type as "host" | "member");
    if (data.q) q = q.ilike("display_name", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const setHostVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { hostId: string; status: "pending" | "verified" | "rejected" };
    if (!x?.hostId || !x?.status) throw new Error("hostId and status required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ verification_status: data.status })
      .eq("id", data.hostId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { userId: string };
    if (!x?.userId) throw new Error("userId required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getHostDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { hostId: string };
    if (!x?.hostId) throw new Error("hostId required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, bio, gender, account_type, verification_status, platform_tier, created_at, interests")
      .eq("id", data.hostId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) throw new Error("Host not found");

    // Signed avatar
    let avatarSignedUrl: string | null = null;
    if (profile.avatar_url) {
      const { data: s } = await supabaseAdmin.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 3600);
      avatarSignedUrl = s?.signedUrl ?? null;
    }

    // All uploaded media, with signed URLs (admin bypass)
    const { data: mediaRows } = await supabaseAdmin
      .from("profile_media")
      .select("id, storage_path, media_type, caption, sort_order, created_at")
      .eq("user_id", data.hostId)
      .order("created_at", { ascending: false });
    const media = await Promise.all(
      (mediaRows ?? []).map(async (row) => {
        const { data: s } = await supabaseAdmin.storage
          .from("profile-media")
          .createSignedUrl(row.storage_path, 3600);
        return { ...row, signedUrl: s?.signedUrl ?? null };
      }),
    );

    // Direct messages: host is sender or recipient (most recent 200)
    const { data: msgs } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at, list_id")
      .or(`sender_id.eq.${data.hostId},recipient_id.eq.${data.hostId}`)
      .order("created_at", { ascending: false })
      .limit(200);

    // Room messages the host authored or received in their own rooms
    const { data: roomMsgs } = await supabaseAdmin
      .from("room_messages")
      .select("id, room_id, sender_id, body, created_at, host_rooms!inner(id, name, host_id)")
      .eq("host_rooms.host_id", data.hostId)
      .order("created_at", { ascending: false })
      .limit(200);


    // Counterpart display names
    const counterpartIds = new Set<string>();
    (msgs ?? []).forEach((m) => {
      if (m.sender_id && m.sender_id !== data.hostId) counterpartIds.add(m.sender_id);
      if (m.recipient_id && m.recipient_id !== data.hostId) counterpartIds.add(m.recipient_id);
    });
    (roomMsgs ?? []).forEach((m) => {
      if (m.sender_id && m.sender_id !== data.hostId) counterpartIds.add(m.sender_id);
    });
    let names: Record<string, string> = {};
    if (counterpartIds.size > 0) {
      const { data: np } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", Array.from(counterpartIds));
      names = Object.fromEntries((np ?? []).map((p) => [p.id, p.display_name ?? "—"]));
    }

    return {
      profile,
      avatarSignedUrl,
      media,
      messages: msgs ?? [],
      roomMessages: roomMsgs ?? [],
      names,
    };
  });

