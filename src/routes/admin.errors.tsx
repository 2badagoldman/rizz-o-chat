import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Bug, RefreshCw, Server, Trash2, Globe } from "lucide-react";

import {
  listErrorLogs,
  clearErrorLogs,
  type ErrorGroup,
  type ErrorLogRow,
} from "@/lib/error-logs.functions";
import { PrismEmptyState } from "@/components/Prism";

export const Route = createFileRoute("/admin/errors")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Error Tracking — Crush admin" },
    ],
  }),
  component: AdminErrors,
});

type SourceFilter = "all" | "client" | "server";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function AdminErrors() {
  const load = useServerFn(listErrorLogs);
  const clear = useServerFn(clearErrorLogs);

  const [source, setSource] = useState<SourceFilter>("all");
  const [rows, setRows] = useState<ErrorLogRow[]>([]);
  const [groups, setGroups] = useState<ErrorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPrint, setOpenPrint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await load({ data: { source, limit: 300 } });
      setRows(res.rows);
      setGroups(res.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load error logs");
    } finally {
      setLoading(false);
    }
  }, [load, source]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const last24 = rows.filter((r) => new Date(r.created_at).getTime() > dayAgo);
    return {
      total: rows.length,
      last24: last24.length,
      client: rows.filter((r) => r.source === "client").length,
      server: rows.filter((r) => r.source === "server").length,
    };
  }, [rows]);

  const detail = openPrint ? groups.find((g) => g.fingerprint === openPrint) : null;

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow">
            <Bug className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-black tracking-tight sm:text-2xl">
              Error tracking
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Browser crashes and server failures with full stack traces.
            </p>
          </div>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex shrink-0 items-center gap-2 rounded-[14px] border border-border bg-card px-3 py-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Events", value: stats.total, icon: AlertTriangle },
          { label: "Last 24h", value: stats.last24, icon: AlertTriangle },
          { label: "Browser", value: stats.client, icon: Globe },
          { label: "Server", value: stats.server, icon: Server },
        ].map((s) => (
          <div key={s.label} className="glass-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 font-display text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "client", "server"] as SourceFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              source === s
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {s === "client" ? "Browser" : s}
          </button>
        ))}
        <button
          onClick={async () => {
            await clear({ data: { olderThanDays: 7 } });
            void refresh();
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear older than 7 days
        </button>
      </div>

      {error ? (
        <p className="glass-card px-4 py-3 text-sm text-destructive">{error}</p>
      ) : groups.length === 0 && !loading ? (
        <PrismEmptyState
          icon={<Bug className="h-6 w-6" />}
          title="No errors recorded"
          description="Nothing has failed in this window. New browser and server errors land here automatically."
        />
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.fingerprint} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenPrint(openPrint === g.fingerprint ? null : g.fingerprint)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left"
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                    g.source === "server" ? "bg-secondary" : "bg-muted"
                  }`}
                >
                  {g.source === "server" ? (
                    <Server className="h-4 w-4" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{g.message}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {g.routes.join(", ") || "—"} · last seen {timeAgo(g.lastSeen)}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {g.count}
                </span>
              </button>

              {detail?.fingerprint === g.fingerprint ? (
                <div className="space-y-3 border-t border-border/60 px-4 py-3">
                  <dl className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                    {[
                      ["Route", g.latest.route ?? "—"],
                      ["Method", g.latest.method ?? "—"],
                      ["Status", g.latest.status ? String(g.latest.status) : "—"],
                      ["Release", g.latest.release ?? "—"],
                      ["User", g.latest.user_id ?? "guest"],
                      ["Session", g.latest.session_id ?? "—"],
                      ["Duration", g.latest.duration_ms ? `${g.latest.duration_ms}ms` : "—"],
                      ["Fingerprint", g.fingerprint],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="font-semibold uppercase tracking-wide text-muted-foreground">
                          {k}
                        </dt>
                        <dd className="truncate">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {g.latest.user_agent ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {g.latest.user_agent}
                    </p>
                  ) : null}

                  {g.latest.stack ? (
                    <pre className="max-h-64 overflow-auto rounded-xl bg-muted/60 p-3 text-[11px] leading-relaxed">
                      {g.latest.stack}
                    </pre>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">No stack trace captured.</p>
                  )}

                  {g.latest.context && Object.keys(g.latest.context).length > 0 ? (
                    <pre className="max-h-40 overflow-auto rounded-xl bg-muted/40 p-3 text-[11px]">
                      {JSON.stringify(g.latest.context, null, 2)}
                    </pre>
                  ) : null}

                  <button
                    onClick={async () => {
                      await clear({ data: { fingerprint: g.fingerprint } });
                      setOpenPrint(null);
                      void refresh();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Resolve &amp; clear this group
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
