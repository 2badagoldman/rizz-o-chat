import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchUsers } from "@/lib/admin-data.functions";
import { Search, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const TYPES = ["all", "member", "host"] as const;
type T = (typeof TYPES)[number];

function AdminUsers() {
  const search = useServerFn(searchUsers);
  const [q, setQ] = useState("");
  const [type, setType] = useState<T>("all");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    search({ data: { q, account_type: type, limit: 100 } }).then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [type]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">User directory</p>
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <div className="flex gap-2 text-xs">
          {TYPES.map((s) => (
            <button
              key={s}
              onClick={() => setType(s)}
              className={
                "rounded-full border px-3 py-1 font-semibold capitalize " +
                (type === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40")
              }
            >
              {s}
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
          placeholder="Search by name…"
          className="w-full bg-transparent text-sm outline-none"
        />
        <button onClick={load} className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Search</button>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Gender</th>
                <th className="px-3 py-2 text-left">Verify</th>
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
                        <p className="truncate text-[10px] text-muted-foreground">{r.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs capitalize">{r.account_type}</td>
                  <td className="px-3 py-2 text-xs capitalize">{r.gender ?? "—"}</td>
                  <td className="px-3 py-2 text-xs capitalize">{r.verification_status ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Link
                        to="/chat/user/$userId"
                        params={{ userId: r.id }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:border-primary hover:text-primary"
                      >
                        <MessageCircle className="h-3 w-3" /> DM
                      </Link>
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
