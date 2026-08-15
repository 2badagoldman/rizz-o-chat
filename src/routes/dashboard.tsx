import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { HostApplicationCard } from "@/components/HostApplicationCard";
import { RedeemCodeCard } from "@/components/RedeemCodeCard";
import { NotificationsCard } from "@/components/NotificationsCard";

import { useAuth } from "@/lib/auth";
import { getHostSelfStats } from "@/lib/host-stats.functions";
import { TrendingUp, Users, Wallet, Trophy } from "lucide-react";
import rizzAiLogo from "@/assets/crush-logo.png.asset.json";


import { PageSkeleton } from "@/components/AuthGate";
import { SignedOutGate } from "@/components/SignedOutGate";
export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Dashboard — Crush" }] }),
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

  if (loading) return <AppShell><PageSkeleton /></AppShell>;
  if (!user) {
    return (
      <SignedOutGate
        title="Sign in to see your dashboard"
        description="Your earnings, friends list activity and payouts all live here."
      />
    );
  }

  const isHost = data?.profile?.account_type === "host";

  return (
    <AppShell>
      <header className="pt-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Your dashboard</p>
        <h1 className="text-2xl">
          Hey {data?.profile?.display_name ?? "there"} <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="" className="inline-block h-7 w-7 rounded-full align-[-4px]" />
        </h1>
      </header>

      <NotificationsCard />

      {loading2 ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading your numbers…</p>
      ) : err ? (
        <p className="pt-10 text-center text-sm text-destructive">{err}</p>
      ) : (
        <>
          {isHost ? (
            <MilestoneCard active={data?.activeFriends ?? 0} toFlip={data?.friendsToFlip ?? 100} unlocked={data?.flipUnlocked ?? false} split={data?.currentSplitPct ?? 35} />
          ) : (
            <>
              <div className="mt-5 rounded-2xl border border-border bg-gradient-brand-soft p-4">
                <p className="text-sm">
                  You&apos;re signed in as a Member. Head to <Link to="/discover" className="text-gradient-brand font-semibold">Discover</Link> to find your first Friends List.
                </p>
              </div>
              <HostApplicationCard />
            </>
          )}

          <RedeemCodeCard />


          <section className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard icon={<Wallet className="h-4 w-4" />} label="Earned (30d)" value={usd(data?.stats?.host_share_cents)} accent />
            <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Gross (30d)" value={usd(data?.stats?.gross_cents)} />
            <MetricCard icon={<Users className="h-4 w-4" />} label="Active Friends" value={String(data?.activeFriends ?? 0)} />
            <MetricCard icon={<Trophy className="h-4 w-4" />} label="Lifetime earned" value={usd(data?.stats?.lifetime_host_share_cents)} />
          </section>

          {isHost && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/host/inbox"
                className="flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Inbox manager (notifications)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Quick-read unread messages in bulk and send one reply to everyone.</p>
                </div>
                <span className="text-gradient-brand font-semibold">→</span>
              </Link>
              <Link
                to="/host/pricing"
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Edit Friends List price</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Change price and preview what members see.</p>
                </div>
                <span className="text-gradient-brand font-semibold">→</span>
              </Link>
              <Link
                to="/host/members"
                className="flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Add members (comp friends)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Invite your girls for free — skip the paywall.</p>
                </div>
                <span className="text-gradient-brand font-semibold">→</span>
              </Link>
              <Link
                to="/host/invites"
                className="flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Free invite links</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Generate a unique link — anyone who joins via it gets a free Friends List seat.</p>
                </div>
                <span className="text-gradient-brand font-semibold">→</span>
              </Link>
              <Link
                to="/host/rooms"
                className="flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Rooms (group chats)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sort your Friends List into private group rooms — like WhatsApp groups.</p>
                </div>
                <span className="text-gradient-brand font-semibold">→</span>
              </Link>
            </div>
          )}

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
                <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="" className="h-5 w-5 rounded-full" /> Ask Crush AI
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
