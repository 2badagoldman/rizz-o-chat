import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PersonRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  account_type: string | null;
  created_at: string;
};

/**
 * Member-to-member + host discovery.
 * Empty query => newest joiners. Non-empty => name search across everyone.
 */
export const discoverPeople = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { q?: string; limit?: number };
    return {
      q: (x.q ?? "").trim().slice(0, 60),
      limit: Math.min(Math.max(Number(x.limit) || 40, 1), 60),
    };
  })
  .handler(async ({ data, context }): Promise<PersonRow[]> => {
    const term = data.q;
    const SELECT = "id, display_name, avatar_url, account_type, created_at";

    // Members can only discover hosts; hosts and admins can discover everyone.
    const { data: me } = await context.supabase
      .from("profiles")
      .select("account_type")
      .eq("id", context.userId)
      .maybeSingle();
    // Matchmaking: you always discover the *other* side.
    // Members find hosts; hosts find members.
    const wantType = me?.account_type === "host" ? "member" : "host";

    // Exact email lookup (privacy: exact match only, never partial email search).
    if (term.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const res = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(term)}&per_page=5`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
        },
      );
      if (!res.ok) return [];
      const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> };
      const ids = (body.users ?? [])
        .filter((u) => (u.email ?? "").toLowerCase() === term.toLowerCase())
        .map((u) => u.id)
        .filter((id) => id !== context.userId);
      if (ids.length === 0) return [];
      let adminQuery = supabaseAdmin.from("profiles").select(SELECT).in("id", ids).is("deleted_at", null);
      adminQuery = adminQuery.eq("account_type", wantType);
      const { data: rows } = await adminQuery;
      return (rows ?? []) as PersonRow[];
    }

    // NOTE: `deleted_at` is not readable by the `authenticated` role, so it can't be
    // used as a filter here — RLS already hides soft-deleted profiles.
    let query = context.supabase
      .from("profiles")
      .select(SELECT)
      .neq("id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    query = query.eq("account_type", wantType);
    if (term) query = query.ilike("display_name", `%${term.replace(/^@/, "")}%`);

    const { data: rows, error } = await query;
    if (error) throw error;
    return (rows ?? []) as PersonRow[];
  });

export type PublicProfile = PersonRow & {
  bio: string | null;
  gender: string | null;
};

/** Public-ish profile card for any member/host, viewable by signed-in users. */
export const getPublicProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { userId?: string };
    return { userId: String(x.userId ?? "") };
  })
  .handler(async ({ data, context }): Promise<PublicProfile | null> => {
    if (!data.userId) return null;
    const { data: row, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, account_type, created_at, bio, gender")
      .eq("id", data.userId)
      .maybeSingle();
    if (error) throw error;
    return (row ?? null) as PublicProfile | null;
  });

