import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertHost(ctx: { supabase: any; userId: string }) {
  const { data: profile, error } = await ctx.supabase
    .from("profiles")
    .select("account_type")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile || profile.account_type !== "host") throw new Error("Only hosts can manage members");
}

async function getOrCreateList(ctx: { supabase: any; userId: string }) {
  const { data: list } = await ctx.supabase
    .from("friends_lists")
    .select("id, price_cents")
    .eq("host_id", ctx.userId)
    .maybeSingle();
  if (list) return list;
  const { data: created, error } = await ctx.supabase
    .from("friends_lists")
    .insert({ host_id: ctx.userId, price_cents: 0, active: true })
    .select("id, price_cents")
    .single();
  if (error) throw error;
  return created;
}

export const hostSearchMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { q?: string };
    return { q: (x.q ?? "").trim() };
  })
  .handler(async ({ data, context }) => {
    await assertHost(context);
    if (!data.q) return [];
    const { data: rows, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, account_type")
      .ilike("display_name", `%${data.q}%`)
      .neq("id", context.userId)
      .limit(25);
    if (error) throw error;
    return rows ?? [];
  });

export const hostListMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertHost(context);
    const list = await getOrCreateList(context);
    const { data: memberships, error } = await context.supabase
      .from("list_memberships")
      .select("id, member_id, status, price_cents_at_join, chat_access_until, started_at")
      .eq("list_id", list.id)
      .order("started_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const ids = (memberships ?? []).map((m: any) => m.member_id);
    let profiles: any[] = [];
    if (ids.length > 0) {
      const r = await context.supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      profiles = r.data ?? [];
    }
    const byId = new Map(profiles.map((p) => [p.id, p]));
    return (memberships ?? []).map((m: any) => ({ ...m, profile: byId.get(m.member_id) ?? null }));
  });

export const hostCompMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { memberId: string };
    if (!x?.memberId) throw new Error("memberId required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertHost(context);
    if (data.memberId === context.userId) throw new Error("Can't add yourself");
    const list = await getOrCreateList(context);
    const { error } = await context.supabase
      .from("list_memberships")
      .upsert(
        {
          list_id: list.id,
          member_id: data.memberId,
          price_cents_at_join: 0,
          status: "active",
          chat_access_until: null,
        },
        { onConflict: "list_id,member_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const hostRemoveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { memberId: string };
    if (!x?.memberId) throw new Error("memberId required");
    return x;
  })
  .handler(async ({ data, context }) => {
    await assertHost(context);
    const list = await getOrCreateList(context);
    const { error } = await context.supabase
      .from("list_memberships")
      .update({ status: "cancelled", chat_access_until: null })
      .eq("list_id", list.id)
      .eq("member_id", data.memberId);
    if (error) throw error;
    return { ok: true };
  });
