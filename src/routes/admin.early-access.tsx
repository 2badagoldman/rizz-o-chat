import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listEarlyAccessSignups } from "@/lib/early-access.functions";
import { Download, Inbox } from "lucide-react";

export const Route = createFileRoute("/admin/early-access")({
  component: EarlyAccessAdmin,
});

type Row = {
  id: string;
  feature: string;
  email: string;
  note: string | null;
  user_id: string | null;
  created_at: string;
};

function EarlyAccessAdmin() {
  const fetchRows = useServerFn(listEarlyAccessSignups);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchRows()
      .then((r) => setRows(r as Row[]))
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [fetchRows]);

  const grouped = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const list = m.get(r.feature) ?? [];
      list.push(r);
      m.set(r.feature, list);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.feature === filter);

  function exportCSV() {
    const header = ["feature", "email", "note", "user_id", "created_at"];
    const csv = [
      header.join(","),
      ...visible.map((r) =>
        [r.feature, r.email, (r.note ?? "").replace(/"/g, '""'), r.user_id ?? "", r.created_at]
          .map((v) => `"${String(v).replace(/\n/g, " ")}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `early-access-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Early access bucket</p>
          <h1 className="text-2xl font-bold">Coming-soon signups</h1>
        </div>
        <button onClick={exportCSV} className="btn-brand inline-flex items-center gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading signups…</p>
      ) : err ? (
        <p className="mt-8 text-sm text-destructive">{err}</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No signups yet. Share a coming-soon link like <code>/soon/store</code> to start collecting.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip label={`All (${rows.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
            {grouped.map(([f, list]) => (
              <Chip key={f} label={`${f} (${list.length})`} active={filter === f} onClick={() => setFilter(f)} />
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-gradient-brand-soft text-primary text-[10px] font-semibold uppercase px-2 py-0.5">
                        {r.feature}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-md truncate">{r.note ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-xs font-semibold border transition-colors " +
        (active
          ? "bg-gradient-brand text-white border-transparent"
          : "bg-card text-muted-foreground border-border hover:bg-muted")
      }
    >
      {label}
    </button>
  );
}
