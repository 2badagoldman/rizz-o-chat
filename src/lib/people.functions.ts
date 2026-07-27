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
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select(SELECT)
        .in("id", ids)
        .is("deleted_at", null);
      return (rows ?? []) as PersonRow[];
    }

    let query = context.supabase
      .from("profiles")
      .select(SELECT)
      .is("deleted_at", null)
      .neq("id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (term) query = query.ilike("display_name", `%${term.replace(/^@/, "")}%`);

    const { data: rows, error } = await query;
    if (error) throw error;
    return (rows ?? []) as PersonRow[];
  });

