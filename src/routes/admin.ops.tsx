import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpsStatus, runOpsManagers, type OpsRun } from "@/lib/ops.functions";
import { MANAGERS } from "@/lib/ops.constants";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ops")({
  head: () => ({
    meta: [
      { title: "Control Room — Crush Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OpsPage,
});

const STATUS_UI: Record<string, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  ok: { icon: CheckCircle2, cls: "text-emerald-500", label: "Healthy" },
  warning: { icon: AlertTriangle, cls: "text-amber-500", label: "Attention" },
  failed: { icon: XCircle, cls: "text-red-500", label: "Failing" },
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function OpsPage() {
  const fetchStatus = useServerFn(getOpsStatus);
  const runFn = useServerFn(runOpsManagers);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-status"],
    queryFn: () => fetchStatus({ data: undefined }),
    refetchInterval: 60_000,
  });

  const run = useMutation({
    mutationFn: (manager: string) => runFn({ data: { manager } }),
    onSuccess: (results) => {
      const bad = results.filter((r) => r.status !== "ok").length;
      toast[bad ? "warning" : "success"](
        bad ? `${bad} manager${bad === 1 ? "" : "s"} flagged something` : "All managers reported healthy",
      );
      void qc.invalidateQueries({ queryKey: ["ops-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = data?.latest ?? {};
  const history: OpsRun[] = data?.history ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Control Room
          </h1>
          <p className="text-sm text-muted-foreground">
            Autonomous managers that keep Crush running smoothly. They also run automatically on a schedule.
          </p>
        </div>
        <button
          className="btn-brand inline-flex items-center gap-2"
          onClick={() => run.mutate("all")}
          disabled={run.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${run.isPending ? "animate-spin" : ""}`} />
          Run all checks
        </button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {MANAGERS.map((m) => (
            <div key={m.id} className="h-36 rounded-2xl border border-border bg-card/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {MANAGERS.map((m) => {
            const row = latest[m.id];
            const ui = STATUS_UI[row?.status ?? "ok"] ?? STATUS_UI.ok!;
            const Icon = ui.icon;
            return (
              <section key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{m.label}</h2>
                    <p className="text-xs text-muted-foreground">{m.blurb}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${ui.cls}`}>
                    <Icon className="h-4 w-4" />
                    {row ? ui.label : "Never run"}
                  </span>
                </div>

                <p className="mt-3 text-sm">{row?.summary ?? "No results yet — run this manager to get a reading."}</p>

                {row ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {Object.entries(row.details ?? {}).map(([k, v]) => (
                      <span key={k} className="rounded-full border border-border px-2 py-0.5">
                        {k.replace(/_/g, " ")}: <strong className="text-foreground">{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {row ? `Last run ${timeAgo(row.created_at)} · ${row.duration_ms}ms` : "—"}
                  </span>
                  <button
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                    onClick={() => run.mutate(m.id)}
                    disabled={run.isPending}
                  >
                    <Play className="h-3 w-3" /> Run now
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Recent activity</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No runs recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {history.map((r) => {
              const ui = STATUS_UI[r.status] ?? STATUS_UI.ok!;
              return (
                <li key={r.id} className="flex items-center gap-3 py-2">
                  <ui.icon className={`h-4 w-4 shrink-0 ${ui.cls}`} />
                  <span className="w-32 shrink-0 text-xs text-muted-foreground">
                    {MANAGERS.find((m) => m.id === r.manager)?.label ?? r.manager}
                  </span>
                  <span className="flex-1 truncate">{r.summary}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.trigger === "schedule" ? "auto" : "manual"} · {timeAgo(r.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
