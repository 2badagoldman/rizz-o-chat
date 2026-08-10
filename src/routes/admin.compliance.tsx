import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getComplianceReport, type ComplianceReport, type ComplianceRow } from "@/lib/compliance-report.functions";
import { AdminContactPanel, type ContactTarget } from "@/components/admin/AdminContactPanel";
import { AlertTriangle, Download, MessageSquare, RefreshCw, ShieldCheck, Clock, Users } from "lucide-react";
import { AvatarImg } from "@/components/Avatar";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Daily Verification Report — Crush Admin" },
    ],
  }),
  component: ComplianceReportPage,
});

type Filter = "all" | "host" | "member" | "overdue" | "awaiting";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ComplianceReportPage() {
  const fetchReport = useServerFn(getComplianceReport);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [contact, setContact] = useState<ContactTarget | null>(null);

  const load = () => {
    setLoading(true);
    setErr(null);
    fetchReport({ data: {} } as never)
      .then((r) => setReport(r as ComplianceReport))
      .catch((e) => setErr(String((e as Error).message ?? e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Refresh once a day while the console stays open.
    const t = setInterval(load, 24 * 60 * 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const all = report?.rows ?? [];
    switch (filter) {
      case "host":
        return all.filter((r) => r.account_type === "host");
      case "member":
        return all.filter((r) => r.account_type !== "host");
      case "overdue":
        return all.filter((r) => r.overdue);
      case "awaiting":
        return all.filter((r) => r.submitted);
      default:
        return all;
    }
  }, [report, filter]);

  const downloadCsv = () => {
    if (!report) return;
    const header = [
      "name",
      "account_type",
      "kyc_status",
      "age_confirmed",
      "signed_up",
      "deadline",
      "days_remaining",
      "overdue",
      "user_id",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.display_name ?? "(no name)",
          r.account_type,
          r.kyc_status,
          r.age_confirmed,
          r.created_at,
          r.kyc_due_at,
          r.days_remaining,
          r.overdue,
          r.id,
        ]
          .map(esc)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rizzla-verification-report-${report.report_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Verification Report</h1>
          <p className="text-sm text-muted-foreground">
            Everyone still missing 18+ age verification / KYC
            {report ? ` — ${fmtDate(report.generated_at)}` : ""}. No accounts are removed; message them directly to
            finish.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh
          </button>
          <button onClick={downloadCsv} disabled={!report} className="btn-brand inline-flex items-center gap-2 text-sm disabled:opacity-50">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{err}</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Outstanding" value={report?.totals.outstanding} icon={Users} />
        <Stat label="Hosts" value={report?.totals.creators} icon={ShieldCheck} />
        <Stat label="Members" value={report?.totals.members} icon={Users} />
        <Stat label="Past deadline" value={report?.totals.overdue} icon={AlertTriangle} tone="warn" />
        <Stat label="Awaiting review" value={report?.totals.awaiting_review} icon={Clock} />
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["host", "Hosts"],
          ["member", "Members"],
          ["overdue", "Past deadline"],
          ["awaiting", "Awaiting review"],
        ] as ReadonlyArray<[Filter, string]>).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
              (filter === key ? "bg-gradient-brand-soft text-primary" : "border border-border text-muted-foreground hover:bg-muted")
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading && !report ? (
          <p className="p-6 text-sm text-muted-foreground">Building today's report…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nobody outstanding — everyone here is verified. 🎉</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <Row
                key={r.id}
                row={r}
                onMessage={() =>
                  setContact({
                    id: r.id,
                    name: r.display_name,
                    avatar_url: r.avatar_url,
                    subtitle: `${r.account_type === "host" ? "Host" : "Member"} · verification ${r.kyc_status}`,
                  })
                }
              />
            ))}
          </ul>
        )}
      </div>
      <AdminContactPanel target={contact} onClose={() => setContact(null)} />
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Users;
  tone?: "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className={"h-3.5 w-3.5 " + (tone === "warn" ? "text-destructive" : "text-primary")} />
        {label}
      </div>
      <p className={"mt-1 text-2xl font-bold " + (tone === "warn" ? "text-destructive" : "")}>{value ?? "—"}</p>
    </div>
  );
}

function Row({ row, onMessage }: { row: ComplianceRow; onMessage: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <AvatarImg
        src={row.avatar_url ?? "/favicon.ico"}
        name={row.display_name}
        className="h-9 w-9 rounded-full object-cover bg-muted"
        fallbackClassName="h-9 w-9 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{row.display_name || "(no name)"}</p>
        <p className="text-xs text-muted-foreground">
          {row.account_type === "host" ? "Host" : "Member"} · joined {fmtDate(row.created_at)} · status {row.kyc_status}
        </p>
      </div>
      <span
        className={
          "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
          (row.overdue
            ? "bg-destructive/15 text-destructive"
            : row.submitted
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground")
        }
      >
        {row.overdue
          ? `${Math.abs(row.days_remaining)}d past deadline`
          : row.submitted
            ? "Awaiting review"
            : `${Math.max(row.days_remaining, 0)}d left`}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onMessage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Message
        </button>
        <Link
          to="/chat/user/$userId"
          params={{ userId: row.id }}
          className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          Full chat
        </Link>
        <Link to="/admin/kyc" className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted">
          Review
        </Link>
      </div>
    </li>
  );
}
