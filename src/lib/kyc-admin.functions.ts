import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only review of an age-verification submission.
 * The underlying privileged routine is not callable by signed-in users, so the
 * admin check happens here and the call is made with the trusted server role.
 */
export const reviewKycSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { submissionId?: string; approve?: boolean; notes?: string };
    if (!i.submissionId || typeof i.submissionId !== "string") throw new Error("submissionId required");
    if (typeof i.approve !== "boolean") throw new Error("approve required");
    const notes = typeof i.notes === "string" ? i.notes.slice(0, 1000) : null;
    return { submissionId: i.submissionId, approve: i.approve, notes };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("admin_review_kyc", {
      _submission_id: data.submissionId,
      _approve: data.approve,
      _notes: data.notes ?? undefined,
    });
    if (error) throw error;

    // Preserve reviewer attribution (the routine runs without a user session).
    await supabaseAdmin
      .from("kyc_submissions")
      .update({ reviewed_by: userId })
      .eq("id", data.submissionId);

    return JSON.parse(JSON.stringify(result ?? {})) as { ok?: boolean; error?: string; user_id?: string };
  });
