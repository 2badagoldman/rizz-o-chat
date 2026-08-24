import { createFileRoute } from "@tanstack/react-router";
import { Rocket, Users, Video, DollarSign, Target, Sparkles, LineChart, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/growth-playbook")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "250K MRR — Admin" }] }),
  component: GrowthPlaybook,
});

function Card({
  icon,
  title,
  children,
  accent,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={
        "rounded-2xl border p-4 " + (accent ? "border-primary/40 bg-gradient-brand-soft" : "border-border bg-card")
      }
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

const MOVES = [
  {
    icon: <Users className="h-4 w-4" />,
    title: "1 · Micro-creator partnerships at absurd ROI",
    body: [
      "Target creators with 2–3k followers in niche communities (looksmaxxing, skincare, dating advice) — not big influencers.",
      "They have limited sponsorship options, so rates are cheap: ~$120 per video.",
      "One $120 video hit 2M views. Test ~100 creators, then double down on whoever pops.",
    ],
  },
  {
    icon: <Video className="h-4 w-4" />,
    title: "2 · \"Inherently viral\" content format",
    body: [
      "No script, no \"sponsored by\" callout. The creator just uses the app on camera.",
      "Screenshot a conversation → show the AI-generated response → react to it working.",
      "The audience sees it and wants to try it. Reference post: 4.9K likes, comments like \"need that app asap!!\"",
    ],
  },
  {
    icon: <DollarSign className="h-4 w-4" />,
    title: "3 · Monthly subscription pricing ($9.99/month)",
    body: [
      "Low monthly entry price keeps signup friction near zero and underwrites cleanly.",
      "Every creator video pays for itself within days, not months.",
    ],
  },
];

const PHASES = [
  {
    label: "Month 1–3",
    goal: "Test 100 micro-creators at $100–$300 each ($10k–$30k creator spend). Some flop, a few go viral.",
  },
  { label: "Month 3–6", goal: "Double down on winning creators, refine onboarding funnel. Target $50k–$100k MRR." },
  { label: "Month 6–12", goal: "Scale the creator machine, launch features, expand to adjacent niches. Target $250k+ MRR." },
  {
    label: "Year 2",
    goal: "Layer in brand sponsorships in city chat rooms, rewarded ads for coins, and creator revenue-share to hit $500k.",
  },
];

const CHECKLIST = [
  "Find 50–100 micro-creators in looksmaxxing, dating advice, and rizz niches on TikTok / Instagram / YouTube Shorts",
  "Pay $100–$300 per test video — they use Crush on camera and show it working",
  "Add minimum view clauses: if it underperforms, they owe another video free",
  "Track which creators convert actual subscribers (UTM links or promo codes per creator)",
  "Double down on the top 10% of creators with recurring deals",
];

const SOURCES = [
  { label: "The Marketing Genius of Kelechi Onyeama — Startup Spells" },
  { label: "How a 22-Year-Old from Nigeria Built $1.5M Apps with Zero Ad Spend" },
  { label: "From Side Project to $60K/Month Success — TechBullion" },
];

function GrowthPlaybook() {
  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Marketing strategy</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Rocket className="h-6 w-6 text-primary" /> 250K MRR
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Creator-driven, zero-ad-spend growth playbook adapted from the Social Wizard case study.
        </p>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["~$60k", "Social Wizard / month"],
          ["$250k", "Collected cash by mid-year"],
          ["$1.5M", "Across apps in 12 months"],
          ["$0", "Paid ad spend"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-primary/40 bg-gradient-brand-soft p-3">
            <div className="text-xl font-semibold text-gradient-brand">{v}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {MOVES.map((m) => (
          <Card key={m.title} icon={m.icon} title={m.title}>
            <ul className="space-y-1.5">
              {m.body.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card icon={<Target className="h-4 w-4" />} title="What this means for Crush" accent>
          <p>
            <strong className="text-foreground">Forget ads as the primary revenue driver.</strong> Kelechi hit $250k+
            without showing a single ad — 100% subscriptions and in-app purchases. Ads cheapen the experience and
            distract from the subscription push.
          </p>
          <p>
            <strong className="text-foreground">Pricing is already right.</strong> $9.99/month for Crush Gold is the same
            price point he validated. Keep it.
          </p>
          <p>
            <strong className="text-foreground">Ads are supplementary</strong> — layer them on after the user base
            exists, never before. The creator-driven viral loop is the engine.
          </p>
        </Card>

        <Card icon={<Sparkles className="h-4 w-4" />} title="Onboarding must hook in session one">
          <p>
            His key insight: deliberately show users a low &ldquo;rizz score&rdquo; on first open, then demonstrate how
            much better the AI response is. The gap between &ldquo;your message&rdquo; and &ldquo;the app&rsquo;s
            message&rdquo; creates instant perceived value and drives subscription conversion.
          </p>
          <p className="rounded-xl border border-primary/30 bg-background/60 p-3 text-foreground">
            If Crush doesn&rsquo;t have a similar &ldquo;aha moment&rdquo; in the first 60 seconds, that&rsquo;s the
            biggest thing to fix.
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card icon={<Users className="h-4 w-4" />} title="Creator strategy — execution checklist">
          <ol className="space-y-2">
            {CHECKLIST.map((c, i) => (
              <li key={c} className="flex gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-brand-soft text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card icon={<LineChart className="h-4 w-4" />} title="The path to $500k / month">
          <div className="space-y-2.5">
            {PHASES.map((p) => (
              <div key={p.label} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{p.label}</p>
                <p className="mt-0.5">{p.goal}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card icon={<ExternalLink className="h-4 w-4" />} title="Sources">
        <ul className="space-y-1">
          {SOURCES.map((s) => (
            <li key={s.label}>{s.label}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
