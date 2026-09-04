import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * `profiles.avatar_url` contains a private storage path. Current profile uploads
 * use `avatars`; older accounts can still point at `profile-media`, so resolve
 * both during the migration window instead of showing a broken initial.
 */
export const signAvatars = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const raw = ((i ?? {}) as { paths?: unknown }).paths;
    const paths = Array.isArray(raw)
      ? raw
          .map((p) => String(p ?? "").trim())
          .filter((p) => p && !p.includes("..") && !/^(https?:|data:|blob:|\/)/i.test(p))
          .slice(0, 100)
      : [];
    return { paths };
  })
  .handler(async ({ data, context }): Promise<Record<string, string>> => {
    if (!data.paths.length) return {};
    const me = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // `profile-media` is paid/private content: mirror the storage RLS policy
    // ("readable by owner or friends") instead of signing any path blindly.
    // `avatars` holds public display photos, so those stay signable.
    const owners = [...new Set(data.paths.map((p) => p.split("/")[0]).filter(Boolean))];
    const allowed = new Map<string, boolean>();
    await Promise.all(
      owners.map(async (owner) => {
        if (owner === me) return void allowed.set(owner, true);
        const { data: ok } = await context.supabase.rpc("has_chat_access", {
          _member_id: me,
          _host_id: owner,
        });
        allowed.set(owner, !!ok);
      }),
    );
    const legacyAllowed = data.paths.filter((p) => allowed.get(p.split("/")[0] ?? ""));

    const [{ data: avatarSigned }, { data: legacySigned }] = await Promise.all([
      supabaseAdmin.storage.from("avatars").createSignedUrls(data.paths, 60 * 60),
      legacyAllowed.length
        ? supabaseAdmin.storage.from("profile-media").createSignedUrls(legacyAllowed, 60 * 60)
        : Promise.resolve({ data: [] as Array<{ path: string | null; signedUrl: string | null; error: unknown }> }),
    ]);
    const out: Record<string, string> = {};
    for (const s of [...(legacySigned ?? []), ...(avatarSigned ?? [])]) {
      if (s.path && s.signedUrl && !s.error) out[s.path] = s.signedUrl;
    }
    return out;
  });
