import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listPaymentAudit, type PaymentAuditRow } from "@/lib/payment-audit.functions";
import { ReceiptText, Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

function usd(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} ${(currency ?? "usd").toUpperCase()}`;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "errors", label: "Errors" },
  { key: "created", label: "Created" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "expired", label: "Expired" },
];

function AdminPayments() {
  const fetchAudit = useServerFn(listPaymentAudit);
  const [rows, setRows] = useState<PaymentAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAudit({ data: { status, search, limit: 200 } })
      .then((r) => setRows(r.rows))
      .finally(() => setLoading(false));
  }, [fetchAudit, status, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Diagnostics</p>
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ReceiptText className="h-5 w-5 text-primary" /> Payment audit log
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every checkout session, status change and webhook event, with the exact error text when something fails.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              status === f.key
                ? "border-primary bg-gradient-brand-soft text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Session, intent or user id"
              className="w-52 bg-transparent text-xs outline-none"
            />
          </div>
          <button
            onClick={load}
            className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No payment events recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Kind</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Session</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="cursor-pointer border-t border-border align-top hover:bg-muted/30"
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs capitalize">{r.kind.replace("_", " ")}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className={r.error_message ? "font-semibold text-destructive" : "text-foreground"}>
                      {r.status}
                    </span>
                    {open === r.id && (
                      <div className="mt-2 space-y-1 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        {r.error_message && <p className="text-destructive">{r.error_message}</p>}
                        <p>user: <span className="font-mono">{r.user_id ?? "—"}</span></p>
                        <p>intent: <span className="font-mono">{r.payment_intent_id ?? "—"}</span></p>
                        <p>env: {r.environment}</p>
                        <pre className="whitespace-pre-wrap font-mono">{r.details ?? "{}"}</pre>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{usd(r.amount_cents, r.currency)}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {r.session_id ? `${r.session_id.slice(0, 18)}…` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
