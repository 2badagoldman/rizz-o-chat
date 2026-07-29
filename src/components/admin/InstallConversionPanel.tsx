import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getGrowthMetrics,
  getGrowthBreakdown,
  type GrowthMetrics,
  type GrowthBreakdownKind,
  type GrowthBreakdownRow,
} from "@/lib/growth.functions";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Download, UserPlus, CreditCard, Percent, X, ChevronRight } from "lucide-react";

const KIND_LABELS: Record<GrowthBreakdownKind, string> = {
  installs: "Installs",
  signups: "Signups",
  subscriptions: "New subscriptions",
  active_subs: "Active subscribers",
  visitors: "Visitors",
};

const RANGES = [7, 30, 90] as const;

export function InstallConversionPanel({ defaultDays = 30 }: { defaultDays?: number }) {
  const fetchGrowth = useServerFn(getGrowthMetrics);
  const [days, setDays] = useState<number>(defaultDays);
  const [data, setData] = useState<GrowthMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchBreakdown = useServerFn(getGrowthBreakdown);
  const [kind, setKind] = useState<GrowthBreakdownKind | null>(null);
  const [rows, setRows] = useState<GrowthBreakdownRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsErr, setRowsErr] = useState<string | null>(null);

  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    setRowsLoading(true);
    setRowsErr(null);
    fetchBreakdown({ data: { kind, days } })
      .then((r) => !cancelled && setRows(r.rows))
      .catch((e) => !cancelled && setRowsErr(String(e?.message ?? e)))
      .finally(() => !cancelled && setRowsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [kind, days, fetchBreakdown]);

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
              sub={`${data?.install_rate ?? 0}% of ${data?.visitors ?? 0} visitors`}
              active={kind === "installs"} onClick={() => setKind(kind === "installs" ? null : "installs")} />
            <Kpi icon={<UserPlus className="h-3.5 w-3.5" />} label="Signups" value={data?.signups ?? 0}
              sub={`${data?.signup_rate ?? 0}% of visitors`}
              active={kind === "signups"} onClick={() => setKind(kind === "signups" ? null : "signups")} />
            <Kpi icon={<CreditCard className="h-3.5 w-3.5" />} label="New subscriptions" value={data?.subscriptions ?? 0}
              sub={`${data?.active_subs ?? 0} active now`} accent
              active={kind === "subscriptions"} onClick={() => setKind(kind === "subscriptions" ? null : "subscriptions")} />
            <Kpi icon={<Percent className="h-3.5 w-3.5" />} label="Active subscribers" value={data?.active_subs ?? 0}
              sub={`${data?.install_to_subscribe_rate ?? 0}% install → paid`} accent
              active={kind === "active_subs"} onClick={() => setKind(kind === "active_subs" ? null : "active_subs")} />
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
                <FunnelRow label="Visitors" value={data?.visitors ?? 0} max={data?.visitors ?? 0} onClick={() => setKind("visitors")} />
                <FunnelRow label="Install prompts" value={data?.install_prompts ?? 0} max={data?.visitors ?? 0} />
                <FunnelRow label="Installs" value={data?.installs ?? 0} max={data?.visitors ?? 0} onClick={() => setKind("installs")} />
                <FunnelRow label="Signups" value={data?.signups ?? 0} max={data?.visitors ?? 0} onClick={() => setKind("signups")} />
                <FunnelRow label="Subscriptions" value={data?.subscriptions ?? 0} max={data?.visitors ?? 0} onClick={() => setKind("subscriptions")} />
              </div>
            </div>
          </div>
          {kind ? (
            <div className="mt-5 rounded-xl border border-primary/30 bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
                <p className="text-xs font-semibold">
                  {KIND_LABELS[kind]}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {rowsLoading ? "loading…" : `${rows.length} shown`}
                  </span>
                </p>
                <button
                  onClick={() => setKind(null)}
                  aria-label="Close list"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {rowsErr ? (
                <p className="p-4 text-center text-xs text-destructive">{rowsErr}</p>
              ) : rowsLoading ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Loading list…</p>
              ) : rows.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Nothing recorded in this window yet.
                </p>
              ) : (
                <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto">
                  {rows.map((r) => {
                    const inner = (
                      <>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{r.title}</p>
                          {r.subtitle ? (
                            <p className="truncate text-[11px] text-muted-foreground">{r.subtitle}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          {r.meta ? <p className="text-[11px] text-muted-foreground">{r.meta}</p> : null}
                          {r.at ? (
                            <p className="text-[11px] tabular-nums text-muted-foreground">
                              {new Date(r.at).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        {r.user_id ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                      </>
                    );
                    const cls = "flex items-center gap-3 px-3 py-2";
                    return (
                      <li key={r.id}>
                        {r.user_id ? (
                          <Link to="/u/$userId" params={{ userId: r.user_id }} className={cls + " justify-between hover:bg-muted/50"}>
                            {inner}
                          </Link>
                        ) : (
                          <div className={cls + " justify-between"}>{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function FunnelRow({ label, value, max, onClick }: { label: string; value: number; max: number; onClick?: () => void }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        {onClick ? (
          <button onClick={onClick} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            {label}
          </button>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/60">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, accent, onClick, active }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean;
  onClick?: () => void; active?: boolean;
}) {
  const Tag = (onClick ? "button" : "div") as "button";
  return (
    <Tag
      onClick={onClick}
      aria-pressed={onClick ? !!active : undefined}
      className={
        "rounded-2xl border p-3 text-left transition-shadow " +
        (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card") +
        (onClick ? " cursor-pointer hover:shadow-md" : "") +
        (active ? " ring-2 ring-primary" : "")
      }
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <p className={"mt-1 text-xl font-semibold " + (accent ? "text-gradient-brand" : "")}>{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </Tag>
  );
}
