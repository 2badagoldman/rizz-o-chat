import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, Crown, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { pageHead, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

const TITLE = "Creator Subscription Pricing Guide — How to Price Your Friends List";
const DESCRIPTION =
  "A practical creator subscription pricing guide: how the New, Rising, Popular and Elite tiers work, what the Milestone Flip at 100 Friends does to long-term earnings, and how to price a membership site for engagement instead of one-off spikes.";
const URL = `${SITE_URL}/blog/creator-pricing-guide`;
const PUBLISHED = "2026-07-24T09:00:00+00:00";
const MODIFIED = "2026-07-29T00:00:00+00:00";

export const Route = createFileRoute("/blog/creator-pricing-guide")({
  head: () => ({
    ...pageHead({
      path: "/blog/creator-pricing-guide",
      title: TITLE,
      description: DESCRIPTION,
      type: "article",
      keywords:
        "creator subscription pricing, membership site strategy, how to price a fan subscription, creator economy earnings, friends list pricing",
      extraMeta: [
        { property: "article:published_time", content: PUBLISHED },
        { property: "article:modified_time", content: MODIFIED },
        { property: "article:section", content: "Creator economy" },
      ],
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": `${URL}#article`,
              headline: TITLE,
              description: DESCRIPTION,
              image: [DEFAULT_OG_IMAGE],
              inLanguage: "en-US",
              datePublished: PUBLISHED,
              dateModified: MODIFIED,
              mainEntityOfPage: { "@type": "WebPage", "@id": URL },
              author: { "@type": "Organization", name: "Crush", url: SITE_URL },
              publisher: {
                "@type": "Organization",
                name: "Crush",
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/icon-512.png`,
                  width: 512,
                  height: 512,
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              "@id": `${URL}#breadcrumbs`,
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Crush", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Creator pricing guide", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),

  component: CreatorPricingGuide,
});

const TIERS = [
  {
    tier: "New",
    range: "0–24 Friends",
    price: "$4.99 – $6.99 / week",
    note: "Price for volume, not margin. Your job in week one is proof: fast replies, a full gallery, and a reason to stay past the trial.",
  },
  {
    tier: "Rising",
    range: "25–99 Friends",
    price: "$6.99 – $9.99 / week",
    note: "Retention data arrives here. Raise price only after two consecutive weeks where renewals beat cancellations.",
  },
  {
    tier: "Popular",
    range: "100–499 Friends",
    price: "$9.99 – $14.99 / week",
    note: "The Milestone Flip lands at 100 Friends. Recurring revenue now outweighs new joins, so protect renewals above all else.",
  },
  {
    tier: "Elite",
    range: "500+ Friends",
    price: "$14.99 – $24.99 / week",
    note: "Scarcity pricing works. Cap new spots, keep response times human, and let tips and gifts carry the upside.",
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-[13.5px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function CreatorPricingGuide() {
  return (
    <AppShell>
      <Link
        to="/"
        aria-label="Back to home"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>

      <header className="mt-3 overflow-hidden rounded-3xl border border-border bg-card/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-4 w-4" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Creator playbook</p>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight">
          How to price your creator subscription
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Maximising earnings through engagement — a tier-by-tier pricing guide for hosts running a
          Friends List on Crush.
        </p>
      </header>

      <article className="mt-5">
        <Section title="Price the relationship, not the content">
          <p>
            Every membership site eventually learns the same lesson: subscribers do not renew because a
            gallery got bigger, they renew because someone answered. Your weekly price is really a promise
            about response time. Set it at a level you can still honour on your busiest week, because a
            missed reply costs more than a few dollars of margin.
          </p>
          <p>
            Start lower than feels comfortable. A full list at $6.99 out-earns a half-empty list at $12.99,
            and it compounds — every renewing Friend is revenue you do not have to re-sell next week.
          </p>
        </Section>

        <Section title="The four tiers, and what to charge in each">
          <div className="mt-3 grid gap-3">
            {TIERS.map((t) => (
              <div key={t.tier} className="rounded-2xl border border-border bg-card/70 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-base font-bold text-foreground">{t.tier}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.range}
                  </p>
                </div>
                <p className="mt-1 text-sm font-bold text-gradient-brand">{t.price}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t.note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="The Milestone Flip at 100 Friends">
          <p>
            Below 100 Friends, almost all of your income is new joins. Above 100, the maths flips: renewals
            become the larger half of every week's total, and small retention gains beat large marketing
            pushes. A 5% improvement in weekly renewals at 200 Friends is worth more than ten new sign-ups.
          </p>
          <p>
            Practically, that means the week you cross 100 is the week to stop discounting and start
            protecting. Cut the promo codes, tighten your reply window, and only raise price in single
            dollar steps so existing Friends never feel repriced overnight.
          </p>
        </Section>

        <Section title="A pricing routine that works">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Review renewals versus cancellations every Sunday — one number, one decision.</li>
            <li>Raise price by $1–$2 only after two straight positive weeks.</li>
            <li>Never raise price and reduce activity in the same week.</li>
            <li>Let tips and gifts, not the base price, absorb your biggest fans' enthusiasm.</li>
            <li>Keep a free or low-cost entry point so new members can hear your voice before committing.</li>
          </ul>
        </Section>

        <Section title="Where the money actually lands">
          <p>
            Your Friends List price is recurring and predictable; tips and coin gifts are spiky and driven by
            moments. Healthy host accounts usually run roughly two-thirds subscription revenue and one-third
            gifts. If gifts dominate, your subscription is underpriced. If subscriptions dominate completely,
            you are probably under-engaging on the days people most want to spend.
          </p>
        </Section>
      </article>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          to="/host/pricing"
          className="flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-brand-soft p-4 transition-colors hover:border-primary"
        >
          <div>
            <p className="text-sm font-semibold">Set your Friends List price</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Preview exactly what members will see.</p>
          </div>
          <Crown className="h-4 w-4 text-primary" />
        </Link>
        <Link
          to="/legal/pricing"
          className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-4 transition-colors hover:border-primary"
        >
          <div>
            <p className="text-sm font-semibold">Full Crush price list</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Coins, Gold and Diamond VIP pricing.</p>
          </div>
          <Sparkles className="h-4 w-4 text-primary" />
        </Link>
      </div>
    </AppShell>
  );
}
