import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Host applications — Crush admin" }] }),
  component: AdminApplications,
});

type Row = {
  id: string;
  user_id: string;
  stage_name: string;
  city: string | null;
  social_handle: string | null;
  pitch: string;
  status: string;
  created_at: string;
};

function AdminApplications() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    supabase
      .from("host_applications")
      .select("id, user_id, stage_name, city, social_handle, pitch, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else setRows((data as Row[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    const { data, error } = await supabase.rpc("admin_review_host_application", {
      _application_id: id,
      _approve: approve,
      _notes: null,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const ok = (data as { ok?: boolean } | null)?.ok;
    if (!ok) {
      toast.error("Application not found");
      return;
    }
    toast.success(approve ? "Approved — host tools unlocked" : "Application declined");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: approve ? "approved" : "rejected" } : r)));
  }

  return (
    <div className="pt-4">
      <h1 className="text-xl font-black tracking-tight">Host applications</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Members stay members until you approve. Approving flips their account to host and unlocks host tools.
      </p>

      {loading ? (
        <p className="pt-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : err ? (
        <p className="pt-8 text-center text-sm text-destructive">{err}</p>
      ) : rows.length === 0 ? (
        <p className="pt-8 text-center text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.stage_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[r.city, r.social_handle].filter(Boolean).join(" · ") || "—"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                    r.status === "approved"
                      ? "bg-primary/15 text-primary"
                      : r.status === "rejected"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.status === "pending" && <Clock className="h-3 w-3" />} {r.status}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{r.pitch}</p>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decide(r.id, true)}
                    disabled={busy === r.id}
                    className="press-spring inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground disabled:opacity-60"
                  >
                    {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, false)}
                    disabled={busy === r.id}
                    className="press-spring inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
