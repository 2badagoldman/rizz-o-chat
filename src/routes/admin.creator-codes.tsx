import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { creatorCodeStats, type CreatorCodeStat } from "@/lib/attribution.functions";
import { Link2, Search } from "lucide-react";

export const Route = createFileRoute("/admin/creator-codes")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Creator Codes — Crush Admin" }],
  }),
  component: AdminCreatorCodes,
});

function AdminCreatorCodes() {
  const load = useServerFn(creatorCodeStats);
  const [rows, setRows] = useState<CreatorCodeStat[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows((await load({ data: {} })) as CreatorCodeStat[]);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load");
      }
    })();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!rows) return [];
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(needle) ||
        (r.label ?? "").toLowerCase().includes(needle) ||
        (r.display_name ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (a, r) => ({
          visits: a.visits + Number(r.visits ?? 0),
          installs: a.installs + Number(r.installs ?? 0),
          signups: a.signups + Number(r.signups ?? 0),
          subscribers: a.subscribers + Number(r.subscribers ?? 0),
          friends: a.friends + Number(r.friends ?? 0),
        }),
        { visits: 0, installs: 0, signups: 0, subscribers: 0, friends: 0 },
      ),
    [filtered],
  );

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Playbook step 4 — Tracking
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl">
            <Link2 className="h-5 w-5 text-primary" /> Creator Codes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every creator gets a unique code. They share{" "}
            <span className="font-mono">rizzlachat.com/r/THEIRCODE</span> in the video description or bio — we attribute
            the click, the install, the signup, the paid subscription and the Friends List join back to them.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, label or creator"
            className="w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Link clicks", totals.visits],
          ["Installs", totals.installs],
          ["Signups", totals.signups],
          ["Paying subs", totals.subscribers],
          ["Friends joined", totals.friends],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Click → signup {pct(totals.signups, totals.visits)} · Signup → paid {pct(totals.subscribers, totals.signups)}
      </p>

      <section className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        {err ? (
          <p className="p-6 text-sm text-destructive">{err}</p>
        ) : !rows ? (
          <p className="p-6 text-sm text-muted-foreground">Loading codes…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No creator codes yet. Creators generate theirs from their Invites page.
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3 text-right">Installs</th>
                <th className="px-4 py-3 text-right">Signups</th>
                <th className="px-4 py-3 text-right">Paying</th>
                <th className="px-4 py-3 text-right">Friends</th>
                <th className="px-4 py-3 text-right">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.code} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold">{r.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.label || "Untitled"}
                      {!r.active ? " · paused" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">{r.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{Number(r.visits).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{Number(r.installs).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{Number(r.signups).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {Number(r.subscribers).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">{Number(r.friends).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {pct(Number(r.subscribers), Number(r.visits))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
