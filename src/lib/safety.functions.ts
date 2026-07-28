import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Trust & safety primitives required for user-generated-content apps
 * (Apple App Store Review Guideline 1.2 / Google Play UGC policy):
 * every member can report abuse and block another user in-app.
 */

export const REPORT_REASONS = [
  "Nudity or sexual content involving a minor",
  "Harassment or bullying",
  "Threats or violence",
  "Spam or scam",
  "Impersonation or fake profile",
  "Non-consensual or stolen content",
  "Other",
] as const;

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as {
      reportedUserId?: string | null;
      reportedHandle?: string | null;
      reason?: string;
      details?: string;
      context?: string;
    };
    const reason = String(x.reason ?? "").trim();
    if (!reason) throw new Error("Pick a reason");
    return {
      reportedUserId: x.reportedUserId ? String(x.reportedUserId) : null,
      reportedHandle: x.reportedHandle ? String(x.reportedHandle).slice(0, 120) : null,
      reason: reason.slice(0, 160),
      details: String(x.details ?? "").trim().slice(0, 2000) || null,
      context: String(x.context ?? "app").slice(0, 60),
    };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_reports").insert({
      reporter_id: context.userId,
      reported_user_id: data.reportedUserId,
      reported_handle: data.reportedHandle,
      reason: data.reason,
      details: data.details,
      context: data.context,
    });
    if (error) throw error;
    return { ok: true as const };
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { userId?: string };
    if (!x.userId) throw new Error("userId required");
    return { userId: String(x.userId) };
  })
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("You can't block yourself");
    const { error } = await context.supabase
      .from("user_blocks")
      .upsert({ blocker_id: context.userId, blocked_id: data.userId }, { onConflict: "blocker_id,blocked_id" });
    if (error) throw error;
    return { blocked: true as const };
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { userId?: string };
    if (!x.userId) throw new Error("userId required");
    return { userId: String(x.userId) };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", context.userId)
      .eq("blocked_id", data.userId);
    if (error) throw error;
    return { blocked: false as const };
  });

export const listMyBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_blocks")
      .select("blocked_id, created_at")
      .eq("blocker_id", context.userId);
    if (error) throw error;
    return (data ?? []) as Array<{ blocked_id: string; created_at: string }>;
  });

export const isBlockedPair = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { userId?: string };
    if (!x.userId) throw new Error("userId required");
    return { userId: String(x.userId) };
  })
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .eq("blocker_id", context.userId)
      .eq("blocked_id", data.userId);
    return { blocked: Boolean(rows?.length) };
  });

/** Admin moderation queue. */
export const adminListReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { status?: string };
    return { status: x.status === "resolved" || x.status === "open" ? x.status : "all" };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    let q = context.supabase
      .from("user_reports")
      .select("id, reporter_id, reported_user_id, reported_handle, reason, details, context, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const adminSetReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { id?: string; status?: string; note?: string };
    if (!x.id) throw new Error("id required");
    const status = x.status === "resolved" ? "resolved" : "open";
    return { id: String(x.id), status, note: String(x.note ?? "").slice(0, 500) || null };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only");
    const { error } = await context.supabase
      .from("user_reports")
      .update({ status: data.status, resolution_note: data.note, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
