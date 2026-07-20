import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { getHostSelfStats } from "@/lib/host-stats.functions";
import { Sparkles, TrendingUp, Users, Wallet, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Rizz Social" }] }),
  component: Dashboard,
});

function usd(cents: number | string | null | undefined) {
  return "$" + (Number(cents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Dashboard() {
  const { user, loading } = useAuth();
  const fetchStats = useServerFn(getHostSelfStats);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchStats>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading2(true);
    fetchStats({ data: { days: 30 } })
      .then(setData)
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading2(false));
  }, [user, fetchStats]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl">Sign in to see your dashboard</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  const isHost = data?.profile?.account_type === "host";

  return (
    <AppShell>
      <header className="pt-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Your dashboard</p>
        <h1 className="text-2xl">
          Hey {data?.profile?.display_name ?? "there"} <span className="text-gradient-brand">✨</span>
        </h1>
      </header>

      {loading2 ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading your numbers…</p>
      ) : err ? (
        <p className="pt-10 text-center text-sm text-destructive">{err}</p>
      ) : (
        <>
          {isHost ? (
            <MilestoneCard active={data?.activeFriends ?? 0} toFlip={data?.friendsToFlip ?? 100} unlocked={data?.flipUnlocked ?? false} split={data?.currentSplitPct ?? 35} />
          ) : (
            <div className="mt-5 rounded-2xl border border-border bg-gradient-brand-soft p-4">
              <p className="text-sm">
                You&apos;re signed in as a Member. Head to <Link to="/discover" className="text-gradient-brand font-semibold">Discover</Link> to find your first Friends List.
              </p>
            </div>
          )}

          <section className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard icon={<Wallet className="h-4 w-4" />} label="Earned (30d)" value={usd(data?.stats?.host_share_cents)} accent />
            <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Gross (30d)" value={usd(data?.stats?.gross_cents)} />
            <MetricCard icon={<Users className="h-4 w-4" />} label="Active Friends" value={String(data?.activeFriends ?? 0)} />
            <MetricCard icon={<Trophy className="h-4 w-4" />} label="Lifetime earned" value={usd(data?.stats?.lifetime_host_share_cents)} />
          </section>

          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Payouts</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MetricCard label="Pending" value={usd(data?.stats?.pending_payout_cents)} compact />
              <MetricCard label="Paid" value={usd(data?.stats?.paid_payout_cents)} compact />
            </div>
            <div className="mt-4 space-y-1">
              {(data?.recentPayouts ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No payouts yet — biweekly via Stripe Connect, $50 minimum.</p>
              ) : (
                (data?.recentPayouts ?? []).map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-border/50 py-1.5 text-xs">
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    <span>{usd(p.amount_cents)}</span>
                    <span className={p.status === "paid" ? "text-primary" : "text-muted-foreground"}>{p.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <Link
            to="/copilot"
            className="mt-5 flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4"
          >
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Ask Rizz AI
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHost ? "How do I hit 100 Friends faster?" : "Help me pick my first Host."}
              </p>
            </div>
            <span className="text-gradient-brand font-semibold">→</span>
          </Link>
        </>
      )}
    </AppShell>
  );
}

function MilestoneCard({ active, toFlip, unlocked, split }: { active: number; toFlip: number; unlocked: boolean; split: number }) {
  const pct = Math.min(100, (active / 100) * 100);
  return (
    <section className="mt-5 rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 shadow-glow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Milestone Flip</p>
        <span className="text-gradient-brand text-sm font-semibold">{split}% split</span>
      </div>
      <h2 className="mt-1 text-lg font-semibold">
        {unlocked ? "🎉 You unlocked 65% — your rate is flipped." : `${toFlip} Friends to flip to 65%`}
      </h2>
      <div className="mt-3 h-2 w-full rounded-full bg-background/40 overflow-hidden">
        <div className="h-full bg-gradient-brand transition-all" style={{ width: pct + "%" }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {active} / 100 active paying Friends {unlocked ? "· sustained ≥30 days locks the flip permanently." : "· hit 100 sustained 30 days and your income roughly doubles."}
      </p>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
  compact,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={"rounded-2xl border p-3 " + (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card")}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={"mt-1 " + (compact ? "text-lg" : "text-xl") + (accent ? " text-gradient-brand font-semibold" : "")}>
        {value}
      </div>
    </div>
  );
}
