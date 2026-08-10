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
  .handler(async ({ data }): Promise<Record<string, string>> => {
    if (!data.paths.length) return {};
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: avatarSigned }, { data: legacySigned }] = await Promise.all([
      supabaseAdmin.storage.from("avatars").createSignedUrls(data.paths, 60 * 60),
      supabaseAdmin.storage.from("profile-media").createSignedUrls(data.paths, 60 * 60),
    ]);
    const out: Record<string, string> = {};
    for (const s of [...(legacySigned ?? []), ...(avatarSigned ?? [])]) {
      if (s.path && s.signedUrl && !s.error) out[s.path] = s.signedUrl;
    }
    return out;
  });
