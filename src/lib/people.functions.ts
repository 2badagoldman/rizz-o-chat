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
export type PeoplePage = {
  people: PersonRow[];
  /** Pass back as `cursor` to fetch the next page; null when the list is exhausted. */
  nextCursor: string | null;
};

export const discoverPeople = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { q?: string; limit?: number; cursor?: string | null };
    return {
      q: (x.q ?? "").trim().slice(0, 60),
      limit: Math.min(Math.max(Number(x.limit) || 40, 1), 60),
      cursor: typeof x.cursor === "string" && x.cursor ? x.cursor : null,
    };
  })
  .handler(async ({ data, context }): Promise<PeoplePage> => {
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

    // Email lookup is intentionally NOT supported: allowing exact-email search
    // enables email-to-identity enumeration. Name search only.
    if (term.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term)) {
      return { people: [], nextCursor: null };
    }


    // NOTE: `deleted_at` is not readable by the `authenticated` role, so it can't be
    // used as a filter here — RLS already hides soft-deleted profiles.
    // Keyset pagination on created_at: constant cost per page no matter how
    // many members exist, unlike OFFSET which re-scans everything before it.
    let query = context.supabase
      .from("profiles")
      .select(SELECT)
      .neq("id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    query = query.eq("account_type", wantType);
    if (data.cursor) query = query.lt("created_at", data.cursor);
    if (term) query = query.ilike("display_name", `%${term.replace(/^@/, "")}%`);

    const { data: rows, error } = await query;
    if (error) throw error;
    const people = (rows ?? []) as PersonRow[];
    const nextCursor =
      people.length === data.limit ? (people[people.length - 1]?.created_at ?? null) : null;
    return { people, nextCursor };
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

