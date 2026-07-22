import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getWarRoom } from "@/lib/war-room.functions";
import { Activity, Users, Eye, Timer, Globe2, Monitor, TrendingUp, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/war-room")({
  head: () => ({ meta: [{ title: "War Room — Rizzla Admin" }] }),
  component: WarRoom,
});

const WINDOWS: Array<{ label: string; hours: number }> = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
];

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Activity; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return <div className="h-16 rounded-lg bg-muted/40" />;
  const max = Math.max(...points, 1);
  const w = 400;
  const h = 64;
  const step = w / Math.max(points.length - 1, 1);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
      <defs>
        <linearGradient id="wr-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#wr-grad)" />
      <path d={d} stroke="hsl(var(--primary))" strokeWidth={2} fill="none" />
    </svg>
  );
}

function WarRoom() {
  const fetchWarRoom = useServerFn(getWarRoom);
  const [hours, setHours] = useState(24);
  const q = useQuery({
    queryKey: ["war-room", hours],
    queryFn: () => fetchWarRoom({ data: { hours } }),
    refetchInterval: 10_000,
  });

  const m = q.data ?? {};
  const timeseries = m.timeseries ?? [];
  const sparkPageviews = timeseries.map((t) => t.pageviews);
  const sparkSessions = timeseries.map((t) => t.sessions);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">War Room</h1>
          <p className="text-xs text-muted-foreground">Live traffic, engagement, and demographics — refreshes every 10s.</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Active now" value={m.active_now ?? 0} sub={`${m.signed_in_now ?? 0} signed in`} />
        <StatCard icon={Users} label="Sessions" value={m.sessions ?? 0} sub={`${m.users ?? 0} signed-in users`} />
        <StatCard icon={Eye} label="Pageviews" value={m.pageviews ?? 0} sub={`${m.events ?? 0} total events`} />
        <StatCard
          icon={Timer}
          label="Avg session"
          value={`${Math.floor((m.avg_session_seconds ?? 0) / 60)}m ${Math.floor((m.avg_session_seconds ?? 0) % 60)}s`}
        />
      </div>

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

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Top pages
          </div>
          <ul className="space-y-1.5 text-sm">
            {(m.top_pages ?? []).map((p) => (
              <li key={p.path} className="flex justify-between gap-3">
                <span className="truncate font-mono text-xs">{p.path}</span>
                <span className="text-muted-foreground">{p.views} views · {p.sessions} sess</span>
              </li>
            ))}
            {(m.top_pages ?? []).length === 0 ? <li className="text-xs text-muted-foreground">No traffic yet.</li> : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" /> Top referrers
          </div>
          <ul className="space-y-1.5 text-sm">
            {(m.top_referrers ?? []).map((r) => (
              <li key={r.referrer} className="flex justify-between gap-3">
                <span className="truncate">{r.referrer}</span>
                <span className="text-muted-foreground">{r.sessions}</span>
              </li>
            ))}
            {(m.top_referrers ?? []).length === 0 ? <li className="text-xs text-muted-foreground">Nothing yet.</li> : null}
          </ul>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Monitor className="h-3.5 w-3.5" /> Devices
          </div>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(m.devices ?? {}).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="text-muted-foreground">{v}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" /> Regions
          </div>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(m.countries ?? {}).slice(0, 10).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="truncate">{k}</span><span className="text-muted-foreground">{v}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Demographics
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase text-muted-foreground">Gender</p>
          <ul className="text-sm">
            {Object.entries(m.demographics?.gender ?? {}).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="text-muted-foreground">{v}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] font-semibold uppercase text-muted-foreground">Account type</p>
          <ul className="text-sm">
            {Object.entries(m.demographics?.account_type ?? {}).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="text-muted-foreground">{v}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
