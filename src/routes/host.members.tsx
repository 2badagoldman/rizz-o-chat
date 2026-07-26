import { PrismEmptyState } from "@/components/Prism";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, Gift, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  hostSearchMembers,
  hostListMembers,
  hostCompMember,
  hostRemoveMember,
} from "@/lib/host-members.functions";

export const Route = createFileRoute("/host/members")({
  head: () => ({ meta: [{ title: "Manage Members — Rizzla" }] }),
  component: HostMembers,
});

function HostMembers() {
  const { user, loading } = useAuth();
  const search = useServerFn(hostSearchMembers);
  const list = useServerFn(hostListMembers);
  const comp = useServerFn(hostCompMember);
  const remove = useServerFn(hostRemoveMember);

  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsHost(data?.account_type === "host"));
  }, [user]);

  const loadMembers = () => {
    setRefreshing(true);
    list().then(setMembers).catch((e) => toast.error(e.message)).finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (isHost) loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  useEffect(() => {
    if (!isHost) return;
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      search({ data: { q } })
        .then(setResults)
        .catch((e) => toast.error(e.message))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, isHost, search]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Sign in as a host</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }
  if (isHost === false) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Hosts only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Only hosts can manage their Friends List members.</p>
        </div>
      </AppShell>
    );
  }
  if (isHost === null) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;

  const activeIds = new Set(members.filter((m) => m.status === "active").map((m) => m.member_id));

  async function addFree(memberId: string, name: string) {
    try {
      await comp({ data: { memberId } });
      toast.success(`${name} added — comped 💌`);
      setQ("");
      setResults([]);
      loadMembers();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function removeMember(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from your Friends List?`)) return;
    try {
      await remove({ data: { memberId } });
      toast.success(`${name} removed`);
      loadMembers();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell>
      <div className="pt-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Host tools</p>
        <h1 className="text-2xl font-bold">Manage Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your girls for free — they skip the paywall and join your chat instantly.
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Gift className="h-4 w-4" /> Comp a friend
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members by name…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        {q.trim() ? (
          <div className="mt-3 space-y-2">
            {searching ? (
              <p className="text-xs text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-muted-foreground">No profiles match &ldquo;{q}&rdquo;.</p>
            ) : (
              results.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold text-white">
                    {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.display_name ?? "Unnamed"}</p>
                    <p className="text-[10px] capitalize text-muted-foreground">{p.account_type}</p>
                  </div>
                  {activeIds.has(p.id) ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase text-emerald-600">In list</span>
                  ) : (
                    <button
                      onClick={() => addFree(p.id, p.display_name ?? "Friend")}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-white shadow-glow"
                    >
                      <UserPlus className="h-3 w-3" /> Add free
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Your Friends List</h2>
          <p className="text-[11px] text-muted-foreground">
            {members.filter((m) => m.status === "active").length} active
          </p>
        </div>

        {refreshing ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
        ) : members.length === 0 ? (
          <PrismEmptyState
            className="mt-3"
            title="No members yet"
            description="Search above to add your first friend — comped members join instantly."
          />

        ) : (
          <div className="mt-3 space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-brand grid place-items-center text-sm font-bold text-white">
                  {(m.profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.profile?.display_name ?? "Member"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {m.status === "active" ? "Active" : "Canceled"}
                    {" · "}
                    {m.price_cents_at_join === 0
                      ? <span className="text-primary font-semibold">Comped</span>
                      : <>${(m.price_cents_at_join / 100).toFixed(2)}</>}
                  </p>
                </div>
                <Link
                  to="/chat/user/$userId"
                  params={{ userId: m.member_id }}
                  className="rounded-full border border-border p-2 hover:border-primary hover:text-primary"
                  aria-label="Message"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Link>
                {m.status === "active" ? (
                  <button
                    onClick={() => removeMember(m.member_id, m.profile?.display_name ?? "Member")}
                    className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
