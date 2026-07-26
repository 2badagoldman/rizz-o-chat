import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Self-serve account deletion.
 *
 * Required by Apple App Store Review Guideline 5.1.1(v) and Google Play's
 * data-deletion policy for any app that lets users create an account.
 * Deleting the auth user cascades to the app tables that reference it.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { confirm?: string };
    return { confirm: String(x.confirm ?? "").trim().toUpperCase() };
  })
  .handler(async ({ data, context }) => {
    if (data.confirm !== "DELETE") throw new Error("Type DELETE to confirm");

    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort cleanup of stored media before removing the auth user.
    try {
      const { data: media } = await supabaseAdmin
        .from("profile_media")
        .select("storage_path")
        .eq("user_id", userId);
      const paths = (media ?? []).map((m: { storage_path: string }) => m.storage_path).filter(Boolean);
      if (paths.length) await supabaseAdmin.storage.from("profile-media").remove(paths);
    } catch {
      /* storage cleanup is best-effort */
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });
