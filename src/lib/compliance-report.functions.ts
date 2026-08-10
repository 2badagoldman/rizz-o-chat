import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ComplianceRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  account_type: "host" | "member" | string;
  kyc_status: string;
  age_confirmed: boolean;
  created_at: string;
  kyc_due_at: string;
  days_remaining: number;
  overdue: boolean;
  submitted: boolean;
};

export type ComplianceReport = {
  generated_at: string;
  report_date: string;
  totals: {
    outstanding: number;
    creators: number;
    members: number;
    overdue: number;
    awaiting_review: number;
    new_today: number;
  };
  rows: ComplianceRow[];
};

/**
 * Daily in-app compliance report: everyone who has not completed 18+ age
 * verification / KYC. Read-only — no accounts are ever removed by this report.
 */
export const getComplianceReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ComplianceReport> => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden — admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")

      .select("id, display_name, avatar_url, account_type, kyc_status, age_confirmed, created_at, kyc_due_at")
      .is("deleted_at", null)
      .neq("kyc_status", "approved")
      .order("kyc_due_at", { ascending: true })
      .limit(1000);
    if (error) throw error;

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rows: ComplianceRow[] = (data ?? []).map((p: any) => {
      const due = new Date(p.kyc_due_at).getTime();
      const days = Math.ceil((due - now) / 86_400_000);
      return {
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        account_type: p.account_type,
        kyc_status: p.kyc_status,
        age_confirmed: Boolean(p.age_confirmed),
        created_at: p.created_at,
        kyc_due_at: p.kyc_due_at,
        days_remaining: days,
        overdue: due < now,
        submitted: p.kyc_status === "pending",
      };
    });

    return {
      generated_at: new Date().toISOString(),
      report_date: new Date().toISOString().slice(0, 10),
      totals: {
        outstanding: rows.length,
        creators: rows.filter((r) => r.account_type === "host").length,
        members: rows.filter((r) => r.account_type !== "host").length,
        overdue: rows.filter((r) => r.overdue).length,
        awaiting_review: rows.filter((r) => r.submitted).length,
        new_today: rows.filter((r) => new Date(r.created_at).getTime() >= startOfDay.getTime()).length,
      },
      rows,
    };
  });
