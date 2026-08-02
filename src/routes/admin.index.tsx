import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMetrics } from "@/lib/admin.functions";
import { listEarlyAccessSignups } from "@/lib/early-access.functions";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, TrendingUp, Wallet, Crown, Inbox, Radio, MessageSquare } from "lucide-react";
import { InstallConversionPanel } from "@/components/admin/InstallConversionPanel";
import { signupsByBackground } from "@/lib/admin-data.functions";

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
          <InstallConversionPanel defaultDays={days} />
          <BackgroundPanel />
          <WaitlistPanel />
        </>
      )}
    </div>
  );
}

type WRow = { id: string; feature: string; email: string; note: string | null; created_at: string };

function WaitlistPanel() {
  const fetchRows = useServerFn(listEarlyAccessSignups);
  const [rows, setRows] = useState<WRow[]>([]);
  const [live, setLive] = useState(false);

  const load = useCallback(() => {
    fetchRows()
      .then((r) => setRows(r as WRow[]))
      .catch(() => {});
  }, [fetchRows]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-waitlist")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "early_access_signups" },
        (payload) => {
          const row = (payload.new ?? payload.old) as WRow | undefined;
          if (!row?.id) return;
          setRows((prev) => {
            const rest = prev.filter((r) => r.id !== row.id);
            if (payload.eventType === "DELETE") return rest;
            return [row, ...rest].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
          });
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const byFeature = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.feature, (m.get(r.feature) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const comments = rows.filter((r) => (r.note ?? "").trim().length > 0);
  const last24 = rows.filter((r) => Date.now() - +new Date(r.created_at) < 86_400_000).length;

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Inbox className="h-4 w-4" /> Waitlist — {rows.length} total · {last24} in last 24h
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
              (live
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                : "border-border text-muted-foreground")
            }
          >
            <Radio className={"h-3 w-3 " + (live ? "animate-pulse" : "")} />
            {live ? "Live" : "…"}
          </span>
          <Link to="/admin/early-access" className="text-xs font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No waitlist signups yet.</p>
      ) : (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">By category</p>
            <div className="mt-2 space-y-1.5">
              {byFeature.map(([f, n]) => (
                <div key={f} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{f.replace(/[-_]/g, " ")}</span>
                  <span className="font-mono">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="h-3 w-3" /> Latest signups &amp; comments
            </p>
            <div className="mt-2 space-y-1.5">
              {rows.slice(0, 6).map((r) => (
                <div key={r.id} className="border-b border-border/50 pb-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-gradient-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      {r.feature}
                    </span>
                    <span className="font-mono break-all">{r.email}</span>
                  </div>
                  {r.note?.trim() && <p className="mt-0.5 text-muted-foreground">{r.note}</p>}
                </div>
              ))}
              {comments.length > 0 && (
                <p className="pt-1 text-[11px] text-muted-foreground">{comments.length} with comments</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
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

type BgRow = { label: string; count: number; pct: number };

function BackgroundPanel() {
  const load = useServerFn(signupsByBackground);
  const [rows, setRows] = useState<BgRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    load(undefined as never)
      .then((r) => {
        setRows(r.rows as BgRow[]);
        setTotal(r.total);
      })
      .catch(() => {});
  }, [load]);

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Signups by background
      </h2>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Optional, self-reported at signup. {total} member{total === 1 ? "" : "s"} answered.
      </p>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No answers yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-sm">{r.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-gradient-brand" style={{ width: `${r.pct}%` }} />
              </span>
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                {r.count} \u00b7 {r.pct}%
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
