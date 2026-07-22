import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllHosts, setHostVerification } from "@/lib/admin-data.functions";
import { Check, X, Clock, Search, Eye } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/admin/hosts")({
  component: AdminHosts,
});

const STATUSES = ["all", "pending", "verified", "rejected"] as const;
type Status = (typeof STATUSES)[number];

function AdminHosts() {
  const fetchHosts = useServerFn(listAllHosts);
  const setStatus = useServerFn(setHostVerification);
  const [status, setSt] = useState<Status>("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchHosts({ data: { status, q } })
      .then(setRows)
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  async function decide(hostId: string, next: "verified" | "rejected" | "pending") {
    try {
      await setStatus({ data: { hostId, status: next } });
      toast.success(`Marked ${next}`);
      setRows((rs) => rs.map((r) => (r.id === hostId ? { ...r, verification_status: next } : r)));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.verification_status ?? "pending"] = (acc[r.verification_status ?? "pending"] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Creator studio</p>
          <h1 className="text-2xl font-bold">Host Applications</h1>
        </div>
        <div className="flex gap-2 text-xs">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setSt(s)}
              className={
                "rounded-full border px-3 py-1 font-semibold capitalize " +
                (status === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40")
              }
            >
              {s} {status === s && counts[s === "all" ? "" : s] != null ? "" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by display name…"
          className="w-full bg-transparent text-sm outline-none"
        />
        <button onClick={load} className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Search
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading hosts…</p>
      ) : err ? (
        <p className="mt-8 text-center text-sm text-destructive">{err}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No hosts match this filter.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Host</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Tier</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Subs</th>
                <th className="px-3 py-2 text-left">Joined</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-brand grid place-items-center text-[10px] font-bold text-white">
                        {(r.display_name ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.display_name ?? "—"}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{r.id.slice(0, 8)} · {r.gender ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2"><Badge status={r.verification_status} /></td>
                  <td className="px-3 py-2 text-xs capitalize">{r.platform_tier ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {r.list?.price_cents != null ? "$" + (r.list.price_cents / 100).toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{r.list?.subscriber_count ?? 0}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button title="Approve" onClick={() => decide(r.id, "verified")} className="rounded-lg border border-border p-1.5 hover:bg-primary/10 hover:text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button title="Pending" onClick={() => decide(r.id, "pending")} className="rounded-lg border border-border p-1.5 hover:bg-yellow-500/10 hover:text-yellow-600">
                        <Clock className="h-3.5 w-3.5" />
                      </button>
                      <button title="Reject" onClick={() => decide(r.id, "rejected")} className="rounded-lg border border-border p-1.5 hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string | null }) {
  const s = status ?? "pending";
  const cls =
    s === "verified" ? "bg-emerald-500/15 text-emerald-600" :
    s === "rejected" ? "bg-destructive/15 text-destructive" :
    "bg-yellow-500/15 text-yellow-700";
  return <span className={"inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + cls}>{s}</span>;
}
