import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getWarRoom } from "@/lib/war-room.functions";
import {
  Activity, Users, Eye, Timer, Globe2, Monitor, TrendingUp, RefreshCw,
  Radio, MapPin, Link as LinkIcon, Smartphone, UserPlus, Repeat,
} from "lucide-react";

export const Route = createFileRoute("/admin/war-room")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "War Room — Rizzla Admin" }] }),
  component: WarRoom,
});

const WINDOWS: Array<{ label: string; hours: number }> = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
];

const REFRESH: Array<{ label: string; ms: number }> = [
  { label: "5s", ms: 5_000 },
  { label: "10s", ms: 10_000 },
  { label: "30s", ms: 30_000 },
  { label: "Off", ms: 0 },
];

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  MA: "Morocco", IT: "Italy", IN: "India", FR: "France", DE: "Germany",
  ES: "Spain", BR: "Brazil", MX: "Mexico", NG: "Nigeria", ZA: "South Africa",
  JP: "Japan", KR: "South Korea", CN: "China", RU: "Russia", NL: "Netherlands",
  SE: "Sweden", NO: "Norway", unknown: "Unknown",
};

function flag(code: string) {
  if (!code || code === "unknown" || code.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + code.charCodeAt(0) - 65) + String.fromCodePoint(A + code.charCodeAt(1) - 65);
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: typeof Activity; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/60">
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${pct}%` }} />
    </div>
  );
}

function RowList({
  rows,
  empty,
}: {
  rows: Array<{ key: string; label: React.ReactNode; value: number; sub?: string }>;
  empty: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.key} className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {r.value}
              {r.sub ? <span className="ml-1 text-[11px]">{r.sub}</span> : null}
            </span>
          </div>
          <Bar value={r.value} max={max} />
        </li>
      ))}
    </ul>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return <div className="h-20 rounded-lg bg-muted/40" />;
  const max = Math.max(...points, 1);
  const w = 400;
  const h = 80;
  const step = w / Math.max(points.length - 1, 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
      <defs>
        <linearGradient id="wr-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#wr-grad)" />
      <path d={d} stroke="hsl(var(--primary))" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function WarRoom() {
  const fetchWarRoom = useServerFn(getWarRoom);
  const [hours, setHours] = useState(24);
  const [refreshMs, setRefreshMs] = useState(10_000);
  const q = useQuery({
    queryKey: ["war-room", hours],
    queryFn: () => fetchWarRoom({ data: { hours } }),
    refetchInterval: refreshMs || false,
  });

  const m = q.data ?? {};
  const timeseries = m.timeseries ?? [];
  const sparkPageviews = timeseries.map((t: any) => t.pageviews);
  const sparkSessions = timeseries.map((t: any) => t.sessions);

  const sourceRows = useMemo(
    () =>
      (m.top_sources ?? []).map((s: any) => ({
        key: s.source,
        label: <span className="font-medium">{s.source}</span>,
        value: s.sessions,
      })),
    [m.top_sources],
  );
  const pageRows = useMemo(
    () =>
      (m.top_pages ?? []).map((p: any) => ({
        key: p.path,
        label: <span className="font-mono text-xs">{p.path}</span>,
        value: p.views,
        sub: `· ${p.sessions} sess`,
      })),
    [m.top_pages],
  );
  const countryRows = useMemo(
    () =>
      Object.entries(m.countries ?? {})
        .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
        .slice(0, 12)
        .map(([code, ct]) => ({
          key: code,
          label: (
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{flag(code)}</span>
              <span>{COUNTRY_NAMES[code] ?? code}</span>
            </span>
          ),
          value: ct as number,
        })),
    [m.countries],
  );
  const deviceRows = useMemo(
    () =>
      Object.entries(m.devices ?? {}).map(([k, v]) => ({
        key: k,
        label: <span className="capitalize">{k}</span>,
        value: v as number,
      })),
    [m.devices],
  );
  const activePathRows = useMemo(
    () =>
      (m.active_paths ?? []).map((p: any) => ({
        key: p.path,
        label: <span className="font-mono text-xs">{p.path}</span>,
        value: p.sessions,
      })),
    [m.active_paths],
  );

  const feed = m.live_feed ?? [];
  const avgMin = Math.floor((m.avg_session_seconds ?? 0) / 60);
  const avgSec = Math.floor((m.avg_session_seconds ?? 0) % 60);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">War Room</h1>
          <p className="text-xs text-muted-foreground">
            Live traffic, sources, countries, devices — auto-refresh every {refreshMs ? `${refreshMs / 1000}s` : "off"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border p-1">
            {WINDOWS.map((w) => (
              <button
                key={w.hours}
                onClick={() => setHours(w.hours)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  hours === w.hours ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-border p-1">
            {REFRESH.map((r) => (
              <button
                key={r.label}
                onClick={() => setRefreshMs(r.ms)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  refreshMs === r.ms ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => q.refetch()}
            className="rounded-full border border-border p-2 hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {q.isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(q.error as Error).message}
        </div>
      ) : null}

      {/* Real-time strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          icon={Radio}
          label="Live · last 5 min"
          value={m.active_now ?? 0}
          sub={`${m.signed_in_now ?? 0} signed in right now`}
        />
        <StatCard icon={Users} label="Sessions" value={m.sessions ?? 0} sub={`${m.users ?? 0} signed-in`} />
        <StatCard icon={Eye} label="Pageviews" value={m.pageviews ?? 0} sub={`${m.events ?? 0} total events`} />
        <StatCard icon={Timer} label="Avg session" value={`${avgMin}m ${avgSec}s`} sub="visit duration" />
      </div>

      {/* New vs returning */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={UserPlus} label="New visitors" value={m.new_visitors ?? 0} sub="first seen in window" />
        <StatCard icon={Repeat} label="Returning" value={m.returning_visitors ?? 0} sub="seen before window" />
      </div>

      {/* Trends */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Pageviews over time</p>
          <Sparkline points={sparkPageviews} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Sessions over time</p>
          <Sparkline points={sparkSessions} />
        </div>
      </div>

      {/* Sources · Pages */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5" /> Traffic sources
          </div>
          <RowList rows={sourceRows} empty="No sources yet." />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Top pages
          </div>
          <RowList rows={pageRows} empty="No pageviews yet." />
        </div>
      </div>

      {/* Countries · Devices · Active pages */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" /> Countries
          </div>
          <RowList rows={countryRows} empty="No country data." />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Monitor className="h-3.5 w-3.5" /> Devices
          </div>
          <RowList rows={deviceRows} empty="No device data." />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Where visitors are now
          </div>
          <RowList rows={activePathRows} empty="Nobody browsing right now." />
        </div>
      </div>

      {/* Live activity feed */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live activity · last 30 min
          </div>
          <span className="text-[11px] text-muted-foreground">{feed.length} events</span>
        </div>
        <div className="max-h-[420px] divide-y divide-border/60 overflow-y-auto">
          {feed.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Waiting for live traffic…</div>
          ) : (
            feed.map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-base leading-none">{flag(e.country)}</span>
                <span className="w-16 shrink-0 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {e.event_type}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{e.path ?? "—"}</span>
                <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                  <Smartphone className="h-3 w-3" /> {e.device}
                </span>
                {e.user_name ? (
                  <span className="hidden max-w-[120px] truncate text-xs text-primary sm:inline">@{e.user_name}</span>
                ) : null}
                <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">{timeAgo(e.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Events + Demographics */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Top custom events
          </div>
          <RowList
            rows={(m.top_events ?? []).map((e: any) => ({
              key: e.event_type,
              label: <span className="font-medium">{e.event_type}</span>,
              value: e.ct,
            }))}
            empty="No custom events yet."
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Gender split
          </div>
          <RowList
            rows={Object.entries(m.demographics?.gender ?? {}).map(([k, v]) => ({
              key: k,
              label: <span className="capitalize">{k}</span>,
              value: v as number,
            }))}
            empty="No profiles yet."
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Account type
          </div>
          <RowList
            rows={Object.entries(m.demographics?.account_type ?? {}).map(([k, v]) => ({
              key: k,
              label: <span className="capitalize">{k}</span>,
              value: v as number,
            }))}
            empty="No accounts yet."
          />
        </div>
      </div>
    </div>
  );
}
