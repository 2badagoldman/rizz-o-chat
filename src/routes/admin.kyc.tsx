import { PrismEmptyState } from "@/components/Prism";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Check, X, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/kyc")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Age verification — Admin" }] }),
  component: AdminKyc,
});

interface Row {
  id: string;
  user_id: string;
  legal_name: string;
  date_of_birth: string;
  document_type: string;
  document_path: string;
  selfie_path: string | null;
  status: string;
  created_at: string;
  review_notes: string | null;
}

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1;
  return a;
}

function AdminKyc() {
  const [rows, setRows] = useState<Row[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    const list = (data ?? []) as Row[];
    setRows(list);

    const paths = list.flatMap((r) => [r.document_path, r.selfie_path].filter(Boolean) as string[]);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("kyc").createSignedUrls(paths, 600);
      const map: Record<string, string> = {};
      (signed ?? []).forEach((s) => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      });
      setUrls(map);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, approve: boolean) => {
    setBusy(id);
    const notes = approve ? undefined : window.prompt("Reason for rejection (shown internally)") ?? undefined;
    try {
      await reviewKycSubmission({ data: { submissionId: id, approve, notes } });
    } finally {
      setBusy(null);
    }
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl">
            <ShieldCheck className="h-6 w-6 text-primary" /> Age verification
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject 18+ checks. Members are restricted 7 days after joining if unverified.
          </p>
        </div>
        <button onClick={load} className="rounded-full border border-border bg-card p-2" aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold capitalize ${
              filter === f ? "border-primary bg-primary/10" : "border-border bg-card text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading submissions…</p>
      ) : rows.length === 0 ? (
        <PrismEmptyState className="mt-8" title="All clear" description="No submissions to review." />
      ) : (
        <div className="mt-5 grid gap-4">
          {rows.map((r) => {
            const a = age(r.date_of_birth);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.legal_name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {r.date_of_birth} · {a} yrs · {r.document_type.replace("_", " ")} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{r.user_id}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      r.status === "approved"
                        ? "bg-primary/15 text-primary"
                        : r.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.status}
                    {a < 18 ? " · UNDER 18" : ""}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[r.document_path, r.selfie_path].filter(Boolean).map((p) => (
                    <a key={p} href={urls[p as string]} target="_blank" rel="noreferrer">
                      <img
                        src={urls[p as string]}
                        alt="Verification document"
                        className="h-40 w-full rounded-xl border border-border object-cover"
                      />
                    </a>
                  ))}
                </div>

                {r.review_notes ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">Notes: {r.review_notes}</p>
                ) : null}

                {r.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busy === r.id}
                      onClick={() => review(r.id, true)}
                      className="btn-brand flex-1 !py-2 text-[13px] disabled:opacity-50"
                    >
                      <Check className="mr-1 inline h-4 w-4" /> Approve 18+
                    </button>
                    <button
                      disabled={busy === r.id}
                      onClick={() => review(r.id, false)}
                      className="flex-1 rounded-full border border-destructive/50 bg-destructive/10 py-2 text-[13px] font-semibold text-destructive disabled:opacity-50"
                    >
                      <X className="mr-1 inline h-4 w-4" /> Reject
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
