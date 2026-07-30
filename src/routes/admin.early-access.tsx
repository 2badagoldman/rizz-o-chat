import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listEarlyAccessSignups } from "@/lib/early-access.functions";
import { Download, Inbox, MessageSquare, Radio } from "lucide-react";

export const Route = createFileRoute("/admin/early-access")({
  component: EarlyAccessAdmin,
  head: () => ({
    meta: [
      { title: "Waitlist & Early Access — Crush Admin" },
      { name: "description", content: "Live waitlist signups by category, with member notes and comments." },
    ],
  }),
});

type Row = {
  id: string;
  feature: string;
  email: string;
  note: string | null;
  user_id: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function EarlyAccessAdmin() {
  const fetchRows = useServerFn(listEarlyAccessSignups);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [live, setLive] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [, tick] = useState(0);
  const seen = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const r = (await fetchRows()) as Row[];
      seen.current = new Set(r.map((x) => x.id));
      setRows(r);
      setErr(null);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [fetchRows]);

  useEffect(() => {
    load();
  }, [load]);

  // re-render for relative timestamps
  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  // periodic refresh: new signups land within 15s (realtime broadcast disabled for privacy)
  useEffect(() => {
    setLive(true);
    const i = setInterval(async () => {
      try {
        const r = (await fetchRows()) as Row[];
        const fresh = r.filter((x) => !seen.current.has(x.id));
        seen.current = new Set(r.map((x) => x.id));
        setRows(r);
        if (fresh.length) {
          const f = fresh[0];
          setFlash(`${f.email} joined the ${f.feature} waitlist`);
          setTimeout(() => setFlash(null), 6000);
        }
      } catch {
        /* keep last good data */
      }
    }, 15_000);
    return () => {
      clearInterval(i);
      setLive(false);
    };
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
  const withNotes = rows.filter((r) => (r.note ?? "").trim().length > 0);
  const last24 = rows.filter((r) => Date.now() - +new Date(r.created_at) < 86_400_000).length;
  const uniqueEmails = new Set(rows.map((r) => r.email.toLowerCase())).size;

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
    a.download = `waitlist-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Waitlist bucket</p>
          <h1 className="text-2xl font-bold">Waitlist &amp; early access</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
              (live
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                : "border-border bg-card text-muted-foreground")
            }
          >
            <Radio className={"h-3 w-3 " + (live ? "animate-pulse" : "")} />
            {live ? "Live" : "Connecting…"}
          </span>
          <button onClick={exportCSV} className="btn-brand inline-flex items-center gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {flash && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-gradient-brand-soft px-4 py-2.5 text-sm font-medium text-primary">
          {flash}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading signups…</p>
      ) : err ? (
        <p className="mt-8 text-sm text-destructive">{err}</p>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total signups" value={String(rows.length)} accent />
            <Stat label="Categories" value={String(grouped.length)} />
            <Stat label="Last 24h" value={String(last24)} />
            <Stat label="Unique emails" value={String(uniqueEmails)} />
          </section>

          {rows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
              <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No signups yet. Share a coming-soon link like <code>/soon/store</code> to start collecting.
                New entries will appear here in real time.
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

              <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Comment</th>
                      <th className="px-3 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id} className="border-t border-border align-top">
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-gradient-brand-soft text-primary text-[10px] font-semibold uppercase px-2 py-0.5">
                            {r.feature}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs break-all">{r.email}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-md whitespace-pre-wrap">
                          {r.note?.trim() ? r.note : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {timeAgo(r.created_at)}
                          <div className="text-[10px] opacity-70">{new Date(r.created_at).toLocaleString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section className="mt-5 rounded-2xl border border-border bg-card p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4" /> Comments &amp; notes ({withNotes.length})
                </h2>
                {withNotes.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">No one has left a comment yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {withNotes.slice(0, 50).map((r) => (
                      <div key={r.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded-full bg-gradient-brand-soft px-2 py-0.5 font-semibold uppercase text-primary">
                            {r.feature}
                          </span>
                          <span className="font-mono">{r.email}</span>
                          <span>· {timeAgo(r.created_at)}</span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm">{r.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-3 " + (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card")}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 text-xl " + (accent ? "text-gradient-brand font-semibold" : "")}>{value}</div>
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
