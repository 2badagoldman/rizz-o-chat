import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Save, Users, Eye, Crown, ArrowLeft } from "lucide-react";

import { PageSkeleton } from "@/components/AuthGate";
export const Route = createFileRoute("/host/pricing")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Edit Friends List Pricing — Crush" },
      { name: "description", content: "Adjust your Friends List monthly price and preview what members will see." },
    ],
  }),
  component: HostPricing,
});

type ListRow = {
  id: string;
  host_id: string;
  title: string | null;
  description: string | null;
  price_cents: number;
  
  subscriber_count: number | null;
  active: boolean | null;
};

const PRESETS = [299, 499, 999, 1499, 1999, 2999, 4999];
const MIN_CENTS = 99;
const MAX_CENTS = 99999;
const HOST_SPLIT_DEFAULT = 0.35; // 35% under 100 Friends · 50% at 100+ · 65% at 500+

function usd(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function HostPricing() {
  const { user, loading } = useAuth();
  const [row, setRow] = useState<ListRow | null>(null);
  const [priceCents, setPriceCents] = useState(499);
  const [dollars, setDollars] = useState("4.99");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("friends_lists")
        .select("id, host_id, title, description, price_cents, subscriber_count, active")
        .eq("host_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) setErr(error.message);
      if (data) {
        setRow(data as ListRow);
        setPriceCents(data.price_cents);
        setDollars((data.price_cents / 100).toFixed(2));
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dirty = row ? priceCents !== row.price_cents : false;
  const outOfRange = priceCents < MIN_CENTS || priceCents > MAX_CENTS;

  const preview = useMemo(() => {
    const monthly = priceCents;
    const hostShareStart = Math.floor(monthly * HOST_SPLIT_DEFAULT);
    const hostShareMid = Math.floor(monthly * 0.5);
    const hostShareFlip = Math.floor(monthly * 0.65);
    const yearly = monthly * 12;
    return { monthly, hostShareStart, hostShareMid, hostShareFlip, yearly };
  }, [priceCents]);

  function applyDollars(next: string) {
    setDollars(next);
    const n = Math.round(Number(next) * 100);
    if (Number.isFinite(n)) setPriceCents(n);
  }

  function pickPreset(cents: number) {
    setPriceCents(cents);
    setDollars((cents / 100).toFixed(2));
  }

  async function save() {
    if (!row) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    const { error } = await supabase
      .from("friends_lists")
      .update({ price_cents: priceCents })
      .eq("id", row.id);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setRow({ ...row, price_cents: priceCents });
    setOk("Saved. Members will see the new price immediately.");
  }

  if (loading) {
    return (
      <AppShell theme="host">
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (loading) return <AppShell><PageSkeleton /></AppShell>;
  if (!user) {
    return (
      <AppShell theme="host">
        <div className="mt-16 rounded-3xl border border-border bg-card p-6 text-center">
          <Crown className="mx-auto h-8 w-8 text-[color:var(--host-primary)]" />
          <h1 className="mt-3 text-xl">Sign in as a Creator</h1>
          <Link to="/auth" className="btn-host mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell theme="host">
      <Link to="/dashboard" className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>

      <header className="mt-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Friends List Studio</p>
        <h1 className="mt-1 text-2xl flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-[color:var(--host-primary)]" /> Edit your price
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the monthly price members pay to join your Friends List. Changes save instantly.
        </p>
      </header>

      {loaded && !row ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-sm">
          You don&apos;t have a Friends List yet.{" "}
          <Link to="/host/onboarding" className="font-semibold text-[color:var(--host-primary)] underline">
            Finish creator onboarding
          </Link>{" "}
          to create one.
        </div>
      ) : !row ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading your list…</p>
      ) : (
        <>
          {/* Editor */}
          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Monthly price (USD)
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <span className="text-lg font-semibold text-muted-foreground">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.99"
                max="999.99"
                value={dollars}
                onChange={(e) => applyDollars(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold outline-none"
              />
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            {outOfRange && (
              <p className="mt-2 text-xs text-destructive">
                Price must be between {usd(MIN_CENTS)} and {usd(MAX_CENTS)}.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickPreset(c)}
                  className={
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-all " +
                    (priceCents === c
                      ? "border-[color:var(--host-primary)] bg-[color:var(--host-primary)]/10 text-[color:var(--host-primary)]"
                      : "border-border bg-background hover:border-[color:var(--host-primary)]/50")
                  }
                >
                  {usd(c)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Current: <strong className="text-foreground">{usd(row.price_cents)}</strong></span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {row.subscriber_count ?? 0} members
              </span>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={!dirty || busy || outOfRange}
              className="btn-host mt-4 inline-flex w-full items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {busy ? "Saving…" : dirty ? "Save new price" : "No changes"}
            </button>

            {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
            {ok && <p className="mt-2 text-xs text-[color:var(--host-primary)]">{ok}</p>}
          </section>

          {/* Live preview */}
          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Member preview
              </h2>
              {dirty && (
                <span className="rounded-full bg-[color:var(--host-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--host-primary)]">
                  Unsaved
                </span>
              )}
            </div>

            <div className="card-story overflow-hidden">
              <div className="bg-gradient-brand-soft px-4 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Friends List</p>
                <p className="mt-1 font-display text-lg font-bold">
                  {row.title || "Your Friends List"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.description || "Direct chats, exclusive posts, and members-only drops."}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gradient-brand">{usd(preview.monthly)}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <button
                  type="button"
                  disabled
                  className="btn-brand mt-3 inline-flex w-full items-center justify-center opacity-90"
                >
                  Join Friends List — {usd(preview.monthly)}/mo
                </button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Cancel anytime · Instant chat access
                </p>
              </div>
            </div>
          </section>

          {/* Earnings breakdown */}
          <section className="mt-5 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">You&apos;ll earn per member</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">0–99 (35%)</p>
                <p className="mt-1 text-lg font-bold">{usd(preview.hostShareStart)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="rounded-xl border border-[color:var(--host-primary)]/40 bg-gradient-brand-soft p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">500+ (65%)</p>
                <p className="mt-1 text-lg font-bold text-gradient-brand">{usd(preview.hostShareFlip)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              At {usd(preview.monthly)}/mo: 100 Friends at 50% = <strong className="text-foreground">{usd(preview.hostShareMid * 100)}</strong>/mo · 500 Friends at 65% = <strong className="text-foreground">{usd(preview.hostShareFlip * 500)}</strong>/mo.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}
