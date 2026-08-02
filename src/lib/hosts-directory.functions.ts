import { createServerFn } from "@tanstack/react-start";

export type DirectoryHost = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

/** Approved (verified) real hosts, shown alongside demo hosts in Discover. */
export const listApprovedHosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<DirectoryHost[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, bio, created_at")
      .eq("account_type", "host")
      .eq("verification_status", "verified")
      .not("avatar_url", "is", null)
      .neq("avatar_url", "")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) return [];
    return (data ?? []) as DirectoryHost[];
  },
);
