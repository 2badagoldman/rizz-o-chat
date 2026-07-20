import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { getAdminMetrics, grantAdminRole } from "@/lib/admin.functions";
import { DollarSign, Users, TrendingUp, Wallet, Crown, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Master Admin — Rizz Social" }] }),
  component: AdminPage,
});

function usd(cents: number | string | null | undefined) {
  const n = Number(cents ?? 0);
  return "$" + (n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AdminPage() {
  const { user, loading } = useAuth();
  const fetchMetrics = useServerFn(getAdminMetrics);
  const promote = useServerFn(grantAdminRole);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchMetrics>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading2(true);
    setErr(null);
    fetchMetrics({ data: { days } })
      .then((r) => setData(r))
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading2(false));
  }, [user, days, fetchMetrics]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Sign in to view admin</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  const forbidden = err?.toLowerCase().includes("forbidden");

  if (forbidden) {
    return (
      <AppShell>
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Admin access required</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            If no master admin exists yet, you can bootstrap yourself as the first one below.
          </p>
          <button
            className="btn-brand mt-4 w-full"
            onClick={async () => {
              try {
                await promote({ data: { targetUserId: user.id } });
                window.location.reload();
              } catch (e) {
                setErr(String((e as Error).message));
              }
            }}
          >
            Make me master admin
          </button>
        </div>
      </AppShell>
    );
  }

  const m = data?.metrics ?? {};
  const gross = Number(m.gross_cents ?? 0);
  const platform = Number(m.platform_cents ?? 0);
  const hostShare = Number(m.host_share_cents ?? 0);
  const bySource = (m.by_source ?? {}) as Record<string, { gross_cents: number; platform_cents: number; count: number }>;

  return (
    <AppShell>
      <header className="pt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Master Admin</p>
          <h1 className="text-2xl">Platform metrics</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
        >
          <option value={7}>7d</option>
          <option value={30}>30d</option>
          <option value={90}>90d</option>
          <option value={365}>1y</option>
        </select>
      </header>

      {loading2 ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading metrics…</p>
      ) : err ? (
        <p className="pt-10 text-center text-sm text-destructive">{err}</p>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard icon={<DollarSign className="h-4 w-4" />} label="Gross revenue" value={usd(gross)} accent />
            <MetricCard icon={<Crown className="h-4 w-4" />} label="Your take" value={usd(platform)} accent />
            <MetricCard icon={<Wallet className="h-4 w-4" />} label="Host earnings" value={usd(hostShare)} />
            <MetricCard icon={<Users className="h-4 w-4" />} label="Active hosts" value={String(m.active_hosts ?? 0)} />
            <MetricCard icon={<Users className="h-4 w-4" />} label="Total members" value={String(m.total_members ?? 0)} />
            <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Active subs" value={String(m.active_subs ?? 0)} />
          </section>

          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
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

          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Payouts</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MetricCard label="Pending" value={usd(m.payouts_pending_cents)} compact />
              <MetricCard label="Paid" value={usd(m.payouts_paid_cents)} compact />
            </div>
            <div className="mt-4 space-y-1">
              {(data?.recentPayouts ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No payouts recorded yet.</p>
              ) : (
                (data?.recentPayouts ?? []).map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-border/50 py-1.5 text-xs">
                    <span className="font-mono text-muted-foreground">{p.host_id.slice(0, 8)}…</span>
                    <span>{usd(p.amount_cents)}</span>
                    <span className={p.status === "paid" ? "text-primary" : "text-muted-foreground"}>{p.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Top hosts</h2>
            <div className="mt-3 space-y-1.5">
              {(data?.topHosts ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No host earnings yet.</p>
              ) : (
                (data?.topHosts ?? []).map((h, i) => (
                  <div key={h.host_id} className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                      <span className="truncate">{h.display_name ?? h.host_id.slice(0, 8)}</span>
                    </span>
                    <span className="font-mono text-xs">
                      <span className="text-primary">{usd(h.host_share_cents)}</span>
                      <span className="text-muted-foreground"> / {usd(h.gross_cents)}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
  compact,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-3 " +
        (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card")
      }
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={"mt-1 " + (compact ? "text-lg" : "text-xl") + (accent ? " text-gradient-brand font-semibold" : "")}>
        {value}
      </div>
    </div>
  );
}
