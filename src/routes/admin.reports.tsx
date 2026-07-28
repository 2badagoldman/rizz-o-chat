import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListReports, adminSetReportStatus } from "@/lib/safety.functions";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Abuse Reports — Rizzla Admin" },
      { name: "description", content: "Review and resolve member abuse reports." },
    ],
  }),
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const list = useServerFn(adminListReports);
  const setReportStatus = useServerFn(adminSetReportStatus);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => list({ data: { status } }),
    refetchInterval: 30_000,
  });

  async function update(id: string, next: "open" | "resolved") {
    await setReportStatus({ data: { id, status: next } });
    await qc.invalidateQueries({ queryKey: ["admin-reports"] });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black">
            <ShieldAlert className="h-5 w-5 text-primary" /> Abuse reports
          </h1>
          <p className="text-xs text-muted-foreground">
            Every in-app report lands here. App Store policy expects action within 24 hours.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-1">
          {(["open", "resolved", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-destructive">
          {(error as Error).message}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : !data?.length ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No {status === "all" ? "" : status} reports.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    About <b>{r.reported_handle ?? r.reported_user_id ?? "unknown"}</b> · from{" "}
                    {r.reporter_id.slice(0, 8)}… · {r.context} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.details ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{r.details}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => update(r.id, r.status === "resolved" ? "open" : "resolved")}
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  {r.status === "resolved" ? "Reopen" : "Mark resolved"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
