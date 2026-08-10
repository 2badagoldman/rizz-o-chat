import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageSkeleton } from "@/components/AuthGate";
import { SignedOutGate } from "@/components/SignedOutGate";
import {
  Sparkles,
  ShieldCheck,
  DollarSign,
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  Camera,
  Crown,
} from "lucide-react";

export const Route = createFileRoute("/host/onboarding")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Become a Creator — Crush" },
      { name: "description", content: "Apply, verify, price your Friends List, and publish — the creator studio for Crush." },
    ],
  }),
  component: HostOnboarding,
});

const STEPS = [
  { id: "apply", label: "Apply", icon: Sparkles },
  { id: "verify", label: "Verify", icon: ShieldCheck },
  { id: "price", label: "Price", icon: DollarSign },
  { id: "publish", label: "Publish", icon: Rocket },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function HostOnboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>("apply");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string>("");
  const [agree, setAgree] = useState(false);
  const [verifyStarted, setVerifyStarted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState(499); // $4.99 default new tier

  if (loading)
    return (
      <AppShell theme="host">
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );

  if (loading) return <AppShell><PageSkeleton /></AppShell>;
  if (!user) {
    return (
      <SignedOutGate
        theme="host"
        cta="Go to sign up"
        icon={<Crown className="h-6 w-6" />}
        title="Sign up as a Creator first"
        description={"Create your account and choose \u201cApply as Creator\u201d on the sign-up screen."}
      />
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.id === step);
  const next = () => setStep(STEPS[Math.min(currentIdx + 1, STEPS.length - 1)].id);
  const prev = () => setStep(STEPS[Math.max(currentIdx - 1, 0)].id);

  const publish = async () => {
    setBusy(true);
    setErr(null);
    try {
      // Update profile (account_type is NEVER self-granted — admins approve hosts)
      const parsedInterests = interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || (user.email ?? "").split("@")[0],
          bio,
          interests: parsedInterests,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const { data: prof } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();

      if (prof?.account_type === "host") {
        // Already approved — create/refresh the Friends List
        const tier = priceCents < 500 ? "new" : priceCents < 2000 ? "rising" : priceCents < 5000 ? "popular" : "elite";
        const { error: fErr } = await supabase.from("friends_lists").insert({
          host_id: user.id,
          title: title || `${displayName || "My"} · Friends List`,
          description,
          price_cents: priceCents,
          tier,
          active: true,
        });
        if (fErr) throw fErr;
      } else {
        // Submit a host application for review; host tools stay locked until approved
        const { error: aErr } = await supabase.from("host_applications").insert({
          user_id: user.id,
          stage_name: displayName || (user.email ?? "").split("@")[0],
          pitch: description || bio || "Applied via creator onboarding.",
        });
        if (aErr && !aErr.message.includes("duplicate")) throw aErr;
      }


      navigate({ to: "/dashboard" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell theme="host">
      <header className="pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--host-primary)]">
          Creator Studio
        </p>
        <h1 className="mt-1 text-2xl">Become a Creator</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Get paid to be yourself. Start at 35% split — flip to <b>65% forever</b> at 100 Friends.
        </p>
      </header>

      {/* Stepper */}
      <ol className="mt-5 flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <li key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className="grid h-9 w-9 place-items-center rounded-full border-2 transition"
                  style={{
                    borderColor: isDone || isActive ? "var(--host-primary)" : "var(--color-border)",
                    background: isActive ? "var(--host-gradient)" : isDone ? "var(--host-primary)" : "var(--color-card)",
                    color: isDone ? "var(--host-primary-fg)" : isActive ? "white" : "var(--color-muted-foreground)",
                  }}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className="mt-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: isActive || isDone ? "var(--host-primary)" : "var(--color-muted-foreground)" }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className="mx-1 h-0.5 flex-1"
                  style={{ background: i < currentIdx ? "var(--host-primary)" : "var(--color-border)" }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
        {step === "apply" ? (
          <div>
            <h2 className="text-lg font-bold">Tell us about you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your Friends see this on your profile. Make it feel like you.
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left text-sm text-muted-foreground"
              >
                <Camera className="h-4 w-4" />
                Upload cover photo (soon)
              </button>
              <input
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[color:var(--host-primary)]"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <textarea
                rows={4}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[color:var(--host-primary)]"
                placeholder="Bio — one sentence hook, then who you are"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[color:var(--host-primary)]"
                placeholder="Interests (comma separated)"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <label className="flex items-start gap-2 rounded-2xl border border-border bg-background/50 p-3 text-xs">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[color:var(--host-primary)]"
                />
                <span>
                  I&apos;m 18+. I agree to the Creator Agreement, FTC #ad disclosure on
                  paid content, and no off-platform payments.
                </span>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                disabled={!agree || !bio}
                onClick={next}
                className="btn-host inline-flex items-center gap-2 disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {step === "verify" ? (
          <div>
            <h2 className="text-lg font-bold">Verify you&apos;re real & 18+</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll match your government ID to a live selfie. This stays private and unlocks payouts.
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">1. Government ID</p>
                <p className="mt-1 text-xs text-muted-foreground">Driver&apos;s license, passport, or state ID.</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">2. Live selfie</p>
                <p className="mt-1 text-xs text-muted-foreground">A short liveness check — no photos of photos.</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">3. Stripe Connect (for payouts)</p>
                <p className="mt-1 text-xs text-muted-foreground">Bank / debit card. Biweekly, $50 minimum.</p>
              </div>
            </div>

            {!verifyStarted ? (
              <button
                onClick={() => setVerifyStarted(true)}
                className="btn-host mt-4 w-full"
              >
                Start verification (demo)
              </button>
            ) : (
              <div className="mt-4 rounded-2xl border p-3 text-xs" style={{ borderColor: "var(--host-primary)", background: "var(--host-soft)" }}>
                <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--host-primary)" }}>
                  <ShieldCheck className="h-4 w-4" /> Verification submitted
                </div>
                <p className="mt-1 text-muted-foreground">
                  In production this hands off to Persona / Stripe Identity. For now, proceed to pricing.
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-between">
              <button onClick={prev} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                disabled={!verifyStarted}
                onClick={next}
                className="btn-host inline-flex items-center gap-2 disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {step === "price" ? (
          <div>
            <h2 className="text-lg font-bold">Price your Friends List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re starting in the <b>New</b> tier ($0.99 – $4.99). Tier caps unlock automatically as Friends grow.
            </p>

            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[color:var(--host-primary)]"
                placeholder="Friends List title (e.g. Aria's Inner Circle)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                rows={3}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[color:var(--host-primary)]"
                placeholder="What Friends get — daily posts, DMs, voice notes, weekly Q&A…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Monthly price</span>
                  <span className="text-3xl font-bold" style={{ color: "var(--host-primary)" }}>
                    ${(priceCents / 100).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={99}
                  max={499}
                  step={100}
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  className="mt-3 w-full accent-[color:var(--host-primary)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>$0.99</span>
                  <span>$4.99</span>
                </div>
              </div>

              <div className="rounded-2xl p-4" style={{ background: "var(--host-soft)", border: "1px solid var(--host-primary)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--host-primary)" }}>
                  You keep 35%
                </p>
                <p className="mt-1 text-sm">
                  ${((priceCents * 0.35) / 100).toFixed(2)} per Friend / month. Hit <b>100 Friends</b> and it flips to <b>65%</b> — ${((priceCents * 0.65) / 100).toFixed(2)} per Friend forever.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={prev} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button disabled={!title} onClick={next} className="btn-host inline-flex items-center gap-2 disabled:opacity-50">
                Review & publish <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {step === "publish" ? (
          <div>
            <h2 className="text-lg font-bold">Review & go live</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This publishes your Friends List. You can edit anytime from Dashboard.
            </p>

            <div className="mt-4 space-y-2 rounded-2xl border border-border bg-background p-4 text-sm">
              <Row label="Display name" value={displayName || "—"} />
              <Row label="Bio" value={bio || "—"} />
              <Row label="Interests" value={interests || "—"} />
              <Row label="List title" value={title || "—"} />
              <Row label="Price" value={`$${(priceCents / 100).toFixed(2)}/mo`} />
              <Row label="Split (starting)" value="35% → 65% at 100 Friends" />
            </div>

            {err ? <p className="mt-3 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{err}</p> : null}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button onClick={prev} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={publish} disabled={busy} className="btn-host inline-flex items-center gap-2 disabled:opacity-50">
                <Rocket className="h-4 w-4" /> {busy ? "Publishing…" : "Publish Friends List"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Need help? Ask <span className="text-gradient-brand font-semibold">Crush AI</span> — she&apos;ll coach you through this whole flow.
      </p>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="truncate text-right">{value}</span>
    </div>
  );
}
