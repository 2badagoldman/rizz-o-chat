import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMetrics } from "@/lib/admin.functions";
import { DollarSign, Users, TrendingUp, Wallet, Crown } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function usd(cents: number | string | null | undefined) {
  return "$" + (Number(cents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AdminDashboard() {
  const fetchMetrics = useServerFn(getAdminMetrics);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchMetrics>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMetrics({ data: { days } })
      .then(setData)
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [days, fetchMetrics]);

  const m = data?.metrics ?? {};
  const gross = Number(m.gross_cents ?? 0);
  const platform = Number(m.platform_cents ?? 0);
  const hostShare = Number(m.host_share_cents ?? 0);
  const bySource = (m.by_source ?? {}) as Record<string, { gross_cents: number; count: number }>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Platform overview</p>
          <h1 className="text-2xl font-bold">Metrics</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
        >
          <option value={7}>7d</option>
          <option value={30}>30d</option>
          <option value={90}>90d</option>
          <option value={365}>1y</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading metrics…</p>
      ) : err ? (
        <p className="mt-8 text-center text-sm text-destructive">{err}</p>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Metric icon={<DollarSign className="h-4 w-4" />} label="Gross" value={usd(gross)} accent />
            <Metric icon={<Crown className="h-4 w-4" />} label="Your take" value={usd(platform)} accent />
            <Metric icon={<Wallet className="h-4 w-4" />} label="Host earnings" value={usd(hostShare)} />
            <Metric icon={<Users className="h-4 w-4" />} label="Active hosts" value={String(m.active_hosts ?? 0)} />
            <Metric icon={<Users className="h-4 w-4" />} label="Members" value={String(m.total_members ?? 0)} />
            <Metric icon={<TrendingUp className="h-4 w-4" />} label="Active subs" value={String(m.active_subs ?? 0)} />
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Revenue by source</h2>
              <div className="mt-3 space-y-2">
                {Object.keys(bySource).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No transactions in this window yet.</p>
                ) : (
                  Object.entries(bySource).map(([src, v]) => (
                    <div key={src} className="flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{src.replace(/_/g, " ")}</span>
                      <span className="font-mono">{usd(v.gross_cents)} <span className="text-muted-foreground">({v.count})</span></span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Top hosts</h2>
              <div className="mt-3 space-y-1.5">
                {(data?.topHosts ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No host earnings yet.</p>
                ) : (
                  (data?.topHosts ?? []).slice(0, 10).map((h, i) => (
                    <div key={h.host_id} className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                        <span className="truncate">{h.display_name ?? h.host_id.slice(0, 8)}</span>
                      </span>
                      <span className="font-mono text-xs whitespace-nowrap">
                        <span className="text-primary">{usd(h.host_share_cents)}</span>
                        <span className="text-muted-foreground"> / {usd(h.gross_cents)}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-3 " + (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card")}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className={"mt-1 text-xl " + (accent ? "text-gradient-brand font-semibold" : "")}>{value}</div>
    </div>
  );
}
