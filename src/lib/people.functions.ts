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
    let query = context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, account_type, created_at")
      .is("deleted_at", null)
      .neq("id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.q) query = query.ilike("display_name", `%${data.q}%`);

    const { data: rows, error } = await query;
    if (error) throw error;
    return (rows ?? []) as PersonRow[];
  });
