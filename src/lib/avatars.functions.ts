import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Profile avatars live in the private `profile-media` bucket, so `profiles.avatar_url`
 * holds a storage path (not a URL). This mints short-lived signed URLs for them.
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
    const { data: signed } = await supabaseAdmin.storage
      .from("profile-media")
      .createSignedUrls(data.paths, 60 * 60);
    const out: Record<string, string> = {};
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl && !s.error) out[s.path] = s.signedUrl;
    }
    return out;
  });
