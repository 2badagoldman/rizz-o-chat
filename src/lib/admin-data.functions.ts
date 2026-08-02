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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, verification_status, gender, platform_tier, created_at, bio, deleted_at")
      .eq("account_type", "host")
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status === "deleted") {
      q = q.not("deleted_at", "is", null);
    } else {
      q = q.is("deleted_at", null);
      if (data.status !== "all") q = q.eq("verification_status", data.status as "pending" | "verified" | "rejected");
    }
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
    // Soft delete: mark deleted_at so we can restore within 7 days.
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const restoreUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { userId: string };
    if (!x?.userId) throw new Error("userId required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: rErr } = await supabaseAdmin
      .from("profiles")
      .select("deleted_at")
      .eq("id", data.userId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!row?.deleted_at) throw new Error("Profile is not deleted");
    const ageMs = Date.now() - new Date(row.deleted_at).getTime();
    if (ageMs > 7 * 24 * 60 * 60 * 1000) {
      throw new Error("Restore window (7 days) has expired");
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ deleted_at: null })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const purgeUserProfile = createServerFn({ method: "POST" })
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


/** Signup mix by self-reported background (admin analytics only). */
export const signupsByBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profile_demographics")
      .select("ethnicity")
      .limit(5000);
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { ethnicity: string | null }[]) {
      const key = row.ethnicity || "Not stated";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      total,
      rows: Object.entries(counts)
        .map(([label, count]) => ({ label, count, pct: total ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count),
    };
  });

/**
 * Account-recovery record for a host (admin only).
 *
 * Passwords are stored by the auth system as one-way salted hashes and are not
 * readable by anyone — including the platform owner. Instead this returns every
 * identifier needed to recover an account (email, phone, sign-in providers,
 * confirmation + last-sign-in timestamps) plus audience/engagement counts.
 */
export const getHostAccountRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { hostId: string };
    if (!x?.hostId) throw new Error("hostId required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.hostId);
    if (uErr) throw uErr;
    const user = u?.user ?? null;

    // Friends list + membership counts
    const { data: lists } = await supabaseAdmin
      .from("friends_lists")
      .select("id, title, price_cents, subscriber_count, active")
      .eq("host_id", data.hostId);
    const listIds = (lists ?? []).map((l) => l.id);

    let activeMembers = 0;
    let totalMembers = 0;
    if (listIds.length > 0) {
      const { count: total } = await supabaseAdmin
        .from("list_memberships")
        .select("id", { count: "exact", head: true })
        .in("list_id", listIds);
      const { count: active } = await supabaseAdmin
        .from("list_memberships")
        .select("id", { count: "exact", head: true })
        .in("list_id", listIds)
        .eq("status", "active");
      totalMembers = total ?? 0;
      activeMembers = active ?? 0;
    }

    // Who they chat with (distinct DM counterparts + volume)
    const { data: msgs } = await supabaseAdmin
      .from("messages")
      .select("sender_id, recipient_id, created_at")
      .or(`sender_id.eq.${data.hostId},recipient_id.eq.${data.hostId}`)
      .order("created_at", { ascending: false })
      .limit(2000);

    const tally = new Map<string, { messages: number; last: string }>();
    for (const m of msgs ?? []) {
      const other = m.sender_id === data.hostId ? m.recipient_id : m.sender_id;
      if (!other) continue;
      const prev = tally.get(other);
      tally.set(other, { messages: (prev?.messages ?? 0) + 1, last: prev?.last ?? m.created_at });
    }
    let partnerNames: Record<string, string> = {};
    if (tally.size > 0) {
      const { data: np } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, account_type")
        .in("id", Array.from(tally.keys()));
      partnerNames = Object.fromEntries((np ?? []).map((p) => [p.id, p.display_name ?? "—"]));
    }
    const chatPartners = Array.from(tally.entries())
      .map(([id, v]) => ({ id, name: partnerNames[id] ?? id.slice(0, 8), messages: v.messages, last: v.last }))
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 50);

    const { count: roomMessageCount } = await supabaseAdmin
      .from("room_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", data.hostId);

    return {
      account: user
        ? {
            email: user.email ?? null,
            phone: user.phone ?? null,
            providers: (user.app_metadata?.providers as string[] | undefined) ??
              (user.app_metadata?.provider ? [user.app_metadata.provider as string] : []),
            created_at: user.created_at ?? null,
            last_sign_in_at: user.last_sign_in_at ?? null,
            email_confirmed_at: (user as { email_confirmed_at?: string | null }).email_confirmed_at ?? null,
            phone_confirmed_at: (user as { phone_confirmed_at?: string | null }).phone_confirmed_at ?? null,
            banned_until: (user as { banned_until?: string | null }).banned_until ?? null,
          }
        : null,
      lists: lists ?? [],
      totalMembers,
      activeMembers,
      dmMessageCount: (msgs ?? []).length,
      roomMessageCount: roomMessageCount ?? 0,
      chatPartners,
    };
  });

/**
 * Mint a one-time password-recovery link for a host who lost access.
 * This is the supported alternative to reading a password: the hash cannot be
 * reversed, so recovery works by issuing a fresh reset link.
 */
export const generateHostRecoveryLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { hostId: string; redirectTo?: string };
    if (!x?.hostId) throw new Error("hostId required");
    return { hostId: x.hostId, redirectTo: x.redirectTo ?? "" };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.hostId);
    if (uErr) throw uErr;
    const email = u?.user?.email;
    if (!email) throw new Error("This account has no email address — recover via phone OTP instead.");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: data.redirectTo ? { redirectTo: data.redirectTo } : undefined,
    });
    if (error) throw error;
    return { email, url: link?.properties?.action_link ?? null };
  });
