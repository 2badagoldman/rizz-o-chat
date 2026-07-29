import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getGrowthMetrics, type GrowthMetrics } from "@/lib/growth.functions";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Download, UserPlus, CreditCard, Percent } from "lucide-react";

const RANGES = [7, 30, 90] as const;

export function InstallConversionPanel({ defaultDays = 30 }: { defaultDays?: number }) {
  const fetchGrowth = useServerFn(getGrowthMetrics);
  const [days, setDays] = useState<number>(defaultDays);
  const [data, setData] = useState<GrowthMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGrowth({ data: { days } })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setErr(String(e?.message ?? e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, fetchGrowth]);

  const series = useMemo(
    () =>
      (data?.timeseries ?? []).map((r) => ({
        ...r,
        label: new Date(r.bucket).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      })),
    [data],
  );

  const platforms = Object.entries(data?.by_platform ?? {});

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Installs vs conversions</h2>
          <p className="text-[11px] text-muted-foreground">
            How many people install the app and how many actually subscribe.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors " +
                (days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">Loading growth metrics…</p>
      ) : err ? (
        <p className="mt-6 text-center text-xs text-destructive">{err}</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi icon={<Download className="h-3.5 w-3.5" />} label="Installs" value={data?.installs ?? 0}
              sub={`${data?.install_rate ?? 0}% of ${data?.visitors ?? 0} visitors`} />
            <Kpi icon={<UserPlus className="h-3.5 w-3.5" />} label="Signups" value={data?.signups ?? 0}
              sub={`${data?.signup_rate ?? 0}% of visitors`} />
            <Kpi icon={<CreditCard className="h-3.5 w-3.5" />} label="New subscriptions" value={data?.subscriptions ?? 0}
              sub={`${data?.active_subs ?? 0} active now`} accent />
            <Kpi icon={<Percent className="h-3.5 w-3.5" />} label="Install → paid" value={`${data?.install_to_subscribe_rate ?? 0}%`}
              sub={`${data?.subscribe_rate ?? 0}% of signups pay`} accent />
          </div>

          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="installFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={18} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="installs" name="Installs" stroke="hsl(var(--primary))" fill="url(#installFill)" strokeWidth={2} />
                <Line type="monotone" dataKey="signups" name="Signups" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="subscriptions" name="Subscriptions" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/70 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Installs by platform</p>
              {platforms.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">No installs recorded in this window yet.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {platforms.map(([p, n]) => (
                    <div key={p} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{p}</span>
                      <span className="font-mono">{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border/70 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Funnel</p>
              <div className="mt-2 space-y-1.5 text-sm">
                <FunnelRow label="Visitors" value={data?.visitors ?? 0} max={data?.visitors ?? 0} />
                <FunnelRow label="Install prompts" value={data?.install_prompts ?? 0} max={data?.visitors ?? 0} />
                <FunnelRow label="Installs" value={data?.installs ?? 0} max={data?.visitors ?? 0} />
                <FunnelRow label="Signups" value={data?.signups ?? 0} max={data?.visitors ?? 0} />
                <FunnelRow label="Subscriptions" value={data?.subscriptions ?? 0} max={data?.visitors ?? 0} />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/60">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={"rounded-2xl border p-3 " + (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card")}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <p className={"mt-1 text-xl font-semibold " + (accent ? "text-gradient-brand" : "")}>{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
