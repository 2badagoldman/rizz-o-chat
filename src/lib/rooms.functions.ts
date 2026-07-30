import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertRoomHost(ctx: { supabase: any; userId: string }, roomId: string) {
  const { data, error } = await ctx.supabase
    .from("host_rooms")
    .select("id, host_id")
    .eq("id", roomId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.host_id !== ctx.userId) throw new Error("Not your room");
  return data;
}

export const listMyRooms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Rooms I host + rooms I'm a member of
    const [hostedRes, memberRes] = await Promise.all([
      context.supabase.from("host_rooms").select("*").eq("host_id", context.userId).order("created_at", { ascending: false }),
      context.supabase.from("room_members").select("room_id, host_rooms(*)").eq("user_id", context.userId),
    ]);
    if (hostedRes.error) throw hostedRes.error;
    if (memberRes.error) throw memberRes.error;
    const hosted = (hostedRes.data ?? []).map((r: any) => ({ ...r, role: "host" as const }));
    const member = (memberRes.data ?? [])
      .map((row: any) => row.host_rooms)
      .filter(Boolean)
      .map((r: any) => ({ ...r, role: "member" as const }));
    const map = new Map<string, any>();
    for (const r of [...hosted, ...member]) if (!map.has(r.id)) map.set(r.id, r);
    return Array.from(map.values());
  });

export const createRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as {
      name?: string; description?: string;
      isPublic?: boolean; category?: string;
      city?: string; state?: string;
      lat?: number; lng?: number;
    };
    const name = (x.name ?? "").trim();
    if (!name) throw new Error("Room name required");
    return {
      name: name.slice(0, 80),
      description: (x.description ?? "").slice(0, 500),
      isPublic: !!x.isPublic,
      category: (x.category ?? "").trim().slice(0, 40) || null,
      city: (x.city ?? "").trim().slice(0, 80) || null,
      state: (x.state ?? "").trim().slice(0, 40) || null,
      lat: typeof x.lat === "number" && isFinite(x.lat) ? x.lat : null,
      lng: typeof x.lng === "number" && isFinite(x.lng) ? x.lng : null,
    };
  })
  .handler(async ({ data, context }) => {
    // Any signed-in member or host can create a room.
    const { data: profile } = await context.supabase
      .from("profiles").select("id").eq("id", context.userId).maybeSingle();
    if (!profile) throw new Error("Complete your profile to create a room");
    const { data: row, error } = await context.supabase
      .from("host_rooms")
      .insert({
        host_id: context.userId,
        name: data.name,
        description: data.description || null,
        is_public: data.isPublic,
        category: data.category,
        city: data.city,
        state: data.state,
        lat: data.lat,
        lng: data.lng,
      })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const listPublicRooms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { lat?: number; lng?: number; limit?: number };
    return {
      lat: typeof x.lat === "number" ? x.lat : null,
      lng: typeof x.lng === "number" ? x.lng : null,
      limit: Math.min(Math.max(x.limit ?? 60, 1), 200),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("host_rooms")
      .select("id, host_id, name, description, category, city, state, lat, lng, created_at, slug, emoji, is_official, co_hosts")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    // Member counts
    const ids = (rows ?? []).map((r: any) => r.id);
    let counts = new Map<string, number>();
    if (ids.length) {
      const { data: mem } = await context.supabase
        .from("room_members").select("room_id").in("room_id", ids);
      for (const r of mem ?? []) counts.set(r.room_id, (counts.get(r.room_id) ?? 0) + 1);
    }
    const list = (rows ?? []).map((r: any) => ({ ...r, member_count: counts.get(r.id) ?? 0 }));
    if (data.lat != null && data.lng != null) {
      const R = 3958.7613;
      const toRad = (d: number) => (d * Math.PI) / 180;
      list.forEach((r: any) => {
        if (r.lat != null && r.lng != null) {
          const dLat = toRad(r.lat - data.lat!);
          const dLng = toRad(r.lng - data.lng!);
          const a = Math.sin(dLat/2)**2 + Math.cos(toRad(data.lat!))*Math.cos(toRad(r.lat))*Math.sin(dLng/2)**2;
          r.distance_miles = 2 * R * Math.asin(Math.sqrt(a));
        } else r.distance_miles = null;
      });
      list.sort((a: any, b: any) => (a.distance_miles ?? 1e9) - (b.distance_miles ?? 1e9));
    }
    return list;
  });

export const joinPublicRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string })
  .handler(async ({ data, context }) => {
    const { data: room, error: rErr } = await context.supabase
      .from("host_rooms").select("id, is_public").eq("id", data.roomId).maybeSingle();
    if (rErr) throw rErr;
    if (!room || !room.is_public) throw new Error("Room is not public");
    const { error } = await context.supabase
      .from("room_members")
      .upsert({ room_id: data.roomId, user_id: context.userId }, { onConflict: "room_id,user_id" });
    if (error) throw error;
    return { ok: true };
  });


export const updateRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string; name?: string; description?: string })
  .handler(async ({ data, context }) => {
    await assertRoomHost(context, data.roomId);
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name.trim().slice(0, 80);
    if (data.description !== undefined) patch.description = data.description.slice(0, 500);
    const { error } = await context.supabase.from("host_rooms").update(patch).eq("id", data.roomId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string })
  .handler(async ({ data, context }) => {
    await assertRoomHost(context, data.roomId);
    const { error } = await context.supabase.from("host_rooms").delete().eq("id", data.roomId);
    if (error) throw error;
    return { ok: true };
  });

export const listRoomMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("room_members")
      .select("id, user_id, added_at")
      .eq("room_id", data.roomId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    const ids = (rows ?? []).map((r: any) => r.user_id);
    let profiles: any[] = [];
    if (ids.length > 0) {
      const r = await context.supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      profiles = r.data ?? [];
    }
    const byId = new Map(profiles.map((p) => [p.id, p]));
    return (rows ?? []).map((m: any) => ({ ...m, profile: byId.get(m.user_id) ?? null }));
  });

export const addRoomMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string; userId: string })
  .handler(async ({ data, context }) => {
    await assertRoomHost(context, data.roomId);
    const { error } = await context.supabase
      .from("room_members")
      .upsert({ room_id: data.roomId, user_id: data.userId }, { onConflict: "room_id,user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const removeRoomMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string; userId: string })
  .handler(async ({ data, context }) => {
    await assertRoomHost(context, data.roomId);
    const { error } = await context.supabase
      .from("room_members")
      .delete()
      .eq("room_id", data.roomId)
      .eq("user_id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listFriendsForRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string })
  .handler(async ({ data, context }) => {
    await assertRoomHost(context, data.roomId);
    const { data: list } = await context.supabase
      .from("friends_lists")
      .select("id")
      .eq("host_id", context.userId)
      .maybeSingle();
    if (!list) return [];
    const { data: memberships, error } = await context.supabase
      .from("list_memberships")
      .select("member_id, status")
      .eq("list_id", list.id)
      .eq("status", "active");
    if (error) throw error;
    const ids = (memberships ?? []).map((m: any) => m.member_id);
    if (ids.length === 0) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ids);
    const { data: inRoom } = await context.supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", data.roomId);
    const inRoomSet = new Set((inRoom ?? []).map((r: any) => r.user_id));
    return (profiles ?? []).map((p: any) => ({ ...p, in_room: inRoomSet.has(p.id) }));
  });

export const getRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string })
  .handler(async ({ data, context }) => {
    const { data: room, error } = await context.supabase
      .from("host_rooms")
      .select("*")
      .eq("id", data.roomId)
      .maybeSingle();
    if (error) throw error;
    if (!room) throw new Error("Room not found");
    return { ...room, is_host: room.host_id === context.userId };
  });

export const listRoomMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { roomId: string; limit?: number })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("room_messages")
      .select("id, sender_id, body, created_at")
      .eq("room_id", data.roomId)
      .order("created_at", { ascending: true })
      .limit(Math.min(data.limit ?? 200, 500));
    if (error) throw error;
    const ids = Array.from(new Set((rows ?? []).map((m: any) => m.sender_id)));
    let profiles: any[] = [];
    if (ids.length > 0) {
      const r = await context.supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      profiles = r.data ?? [];
    }
    const byId = new Map(profiles.map((p) => [p.id, p]));
    return (rows ?? []).map((m: any) => ({ ...m, sender: byId.get(m.sender_id) ?? null }));
  });

export const sendRoomMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { roomId: string; body: string };
    const body = (x.body ?? "").trim();
    if (!x.roomId) throw new Error("roomId required");
    if (!body) throw new Error("Empty message");
    return { roomId: x.roomId, body: body.slice(0, 2000) };
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("room_messages")
      .insert({ room_id: data.roomId, sender_id: context.userId, body: data.body })
      .select("id, sender_id, body, created_at")
      .single();
    if (error) throw error;
    return row;
  });
