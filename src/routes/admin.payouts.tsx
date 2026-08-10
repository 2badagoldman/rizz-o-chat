import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMetrics } from "@/lib/admin.functions";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/admin/payouts")({
  component: AdminPayouts,
});

function usd(cents: number | string | null | undefined) {
  return "$" + (Number(cents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AdminPayouts() {
  const fetchMetrics = useServerFn(getAdminMetrics);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics({ data: { days: 365 } }).then(setData).finally(() => setLoading(false));
  }, [fetchMetrics]);

  const m = data?.metrics ?? {};

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Money movement</p>
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Pending</p>
          <p className="mt-1 text-2xl font-bold text-gradient-brand">{usd(m.payouts_pending_cents)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Paid</p>
          <p className="mt-1 text-2xl font-bold">{usd(m.payouts_paid_cents)}</p>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Recent payouts</h2>
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (data?.recentPayouts ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No payouts recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Creator</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentPayouts ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.host_id.slice(0, 8)}…</td>
                  <td className="px-4 py-2 text-right font-mono">{usd(p.amount_cents)}</td>
                  <td className="px-4 py-2 text-xs capitalize">
                    <span className={p.status === "paid" ? "text-primary font-semibold" : "text-muted-foreground"}>{p.status}</span>
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
