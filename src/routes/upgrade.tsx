import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Check, Gem, Sparkles, Star, Zap } from 'lucide-react';
import { DiamondGem, GoldMedallion } from '@/components/PreciousIcons';
import { pageHead, breadcrumbLd, jsonLd, SITE_URL } from "@/lib/seo";
import { useIosBillingRestricted } from '@/hooks/useNative';
import { AppStoreBillingNotice } from '@/components/AppStoreBillingNotice';
import { RevenueCatPurchase } from '@/components/RevenueCatPurchase';
import { AltPaymentOptions } from '@/components/AltPaymentOptions';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import type { CrushPriceId } from '@/lib/revenuecat';


export const Route = createFileRoute('/upgrade')({
  head: () => ({
    ...pageHead({
      path: "/upgrade",
      title: "Upgrade to Crush Gold or Diamond VIP \u2014 Crush",
      description: "Crush Gold $9.99/week unlocks any Friends List. Crush Diamond VIP $19.99/week adds a diamond badge and weekly coin drops.",
      keywords: "crush gold, diamond vip, membership pricing, unlock friends list, weekly subscription",
    }),
    scripts: [
      breadcrumbLd([
        { name: "Crush", path: "/" },
        { name: "Upgrade", path: "/upgrade" },
      ]),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Crush membership",
        description: "Weekly memberships that unlock creator Friends Lists on Crush.",
        brand: { "@type": "Brand", name: "Crush" },
        url: `${SITE_URL}/upgrade`,
        offers: [
          {
            "@type": "Offer",
            name: "Crush Gold",
            price: "9.99",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/upgrade`,
          },
          {
            "@type": "Offer",
            name: "Crush Diamond VIP",
            price: "19.99",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/upgrade`,
          },
        ],
      }),
    ],
  }),
  component: UpgradePage,
});


type Perk = { label: string; detail: string };

type Plan = {
  id: string;
  name: string;
  price: string;
  tagline: string;
  icon: typeof Star;
  diamond?: boolean;
  includesNote?: string;
  perks: Perk[];
};

const PLANS: Plan[] = [
  {
    id: 'rizz_gold_weekly',
    name: 'Crush Gold',
    price: '$9.99',
    tagline: 'The key that opens every Friends List',
    icon: Star,
    perks: [
      { label: 'Unlock any Friends List', detail: 'No per-creator unlock fees — every list opens with your membership.' },
      { label: 'Unlimited discovery', detail: 'Scroll all 100+ creators with no daily cap.' },
      { label: 'AI copilot boosts', detail: 'Crush AI drafts openers and replies that actually land.' },
      { label: 'Priority chat placement', detail: 'Your messages sit at the top of a creator’s inbox.' },
      { label: 'Zero ads', detail: 'No promos, no interruptions, ever.' },
    ],
  },
  {
    id: 'rizz_diamond_weekly',
    name: 'Crush Diamond VIP',
    price: '$19.99',
    tagline: 'Gold + Diamond, unlocked together',
    icon: Gem,
    diamond: true,
    includesNote: 'Everything in Crush Gold, plus:',
    perks: [
      { label: '2,000 coins every week', detail: 'Worth ~$20 — gifts, unlocks and boosts on the house.' },
      { label: 'Diamond badge', detail: 'A prism badge on your profile and in every room.' },
      { label: 'Top-of-list visibility', detail: 'Creators see you first in DMs, rooms and invites.' },
      { label: 'Early access to new creators', detail: '24-hour head start before anyone else can chat.' },
      { label: 'Concierge support', detail: 'Priority replies from our team, any day of the week.' },
    ],
  },
];


function Bubbles() {
  const bubbles = [
    { left: '6%', size: 46, delay: '0s', tint: 'from-primary/30' },
    { left: '28%', size: 22, delay: '1.6s', tint: 'from-accent/40' },
    { left: '52%', size: 64, delay: '3.1s', tint: 'from-primary/20' },
    { left: '74%', size: 30, delay: '0.8s', tint: 'from-accent/30' },
    { left: '90%', size: 18, delay: '2.4s', tint: 'from-primary/40' },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b) => (
        <span
          key={b.left}
          className={`bubble bottom-0 bg-gradient-to-br ${b.tint} to-transparent blur-[2px]`}
          style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
}

function PlanCard({ plan, index, onSubscribe, hideCard = false }: { plan: Plan; index: number; onSubscribe: () => void; hideCard?: boolean }) {
  const Icon = plan.icon;
  const diamond = !!plan.diamond;
  return (
    <div
      data-reveal
      style={{ transitionDelay: `${index * 90}ms` }}
      className={`relative ${diamond ? 'p-[1.5px] rounded-[1.9rem] overflow-hidden' : ''}`}
    >
      {/* animated prism border for the diamond tier */}
      {diamond && (
        <span
          aria-hidden
          className="facet-spin pointer-events-none absolute left-1/2 top-1/2 h-[190%] w-[190%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,#38bdf8,#ffffff,#a855f7,#ffffff,#ec4899,#ffffff,#38bdf8)] opacity-90"
        />
      )}
      <div
        className={`press-spring group relative overflow-hidden rounded-[1.75rem] p-6 backdrop-blur-2xl ${
          diamond
            ? 'border border-white/70 bg-white/90 shadow-pop'
            : 'border border-border/70 bg-card/70 shadow-card'
        }`}
      >
      {/* ambient light field */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl glow-breathe ${
          diamond ? 'bg-gradient-to-br from-sky-300/70 via-fuchsia-300/60 to-pink-300/50' : 'bg-gradient-to-br from-primary/25 to-accent/20'
        }`}
      />
      {diamond && (
        <>
          {/* refracted caustics */}
          <span
            aria-hidden
            className="caustic pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(50%_40%_at_20%_20%,rgba(56,189,248,.45),transparent_70%),radial-gradient(45%_40%_at_85%_30%,rgba(236,72,153,.4),transparent_70%),radial-gradient(60%_50%_at_50%_100%,rgba(168,85,247,.4),transparent_70%)] blur-2xl"
          />
          {/* holographic facet sheet */}
          <span
            aria-hidden
            className="prism-shift pointer-events-none absolute inset-0 opacity-[.07] mix-blend-soft-light bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,.9)_35%,transparent_48%,rgba(125,211,252,.7)_60%,transparent_72%,rgba(244,114,182,.7)_84%,transparent_95%)]"
          />
          <span aria-hidden className="sheen-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/80" />
          {/* twinkling facets */}
          {[
            { top: '12%', left: '78%', s: 10, d: '0s' },
            { top: '58%', left: '8%', s: 8, d: '1.1s' },
            { top: '80%', left: '62%', s: 12, d: '2.1s' },
            { top: '34%', left: '46%', s: 7, d: '1.7s' },
          ].map((t) => (
            <span
              key={`${t.top}${t.left}`}
              aria-hidden
              className="twinkle pointer-events-none absolute bg-white"
              style={{
                top: t.top,
                left: t.left,
                width: t.s,
                height: t.s,
                animationDelay: t.d,
                clipPath: 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)',
              }}
            />
          ))}
          <span
            aria-hidden
            className="facet-spin pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-[2rem] bg-[conic-gradient(from_0deg,rgba(255,255,255,.75),rgba(125,211,252,.35),rgba(244,114,182,.35),rgba(255,255,255,.75))] opacity-40 blur-2xl"
          />
        </>
      )}
      {!diamond && (
        <>
          {/* molten gold light pool */}
          <span
            aria-hidden
            className="caustic pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_18%_18%,rgba(247,224,138,.55),transparent_70%),radial-gradient(40%_35%_at_88%_28%,rgba(212,160,23,.4),transparent_70%),radial-gradient(60%_45%_at_50%_105%,rgba(255,236,170,.45),transparent_70%)] blur-2xl"
          />
          {/* gold leaf sheen sweeping across the card */}
          <span
            aria-hidden
            className="prism-shift pointer-events-none absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[linear-gradient(115deg,transparent_25%,rgba(255,251,230,.95)_38%,transparent_50%,rgba(212,160,23,.6)_64%,transparent_78%)]"
          />
          <span aria-hidden className="sheen-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" />
          {[
            { top: '16%', left: '82%', s: 9, d: '0.4s' },
            { top: '66%', left: '10%', s: 7, d: '2.4s' },
            { top: '86%', left: '58%', s: 10, d: '1.4s' },
          ].map((t) => (
            <span
              key={`g${t.top}${t.left}`}
              aria-hidden
              className="gold-glint pointer-events-none absolute bg-[#fff6cf]"
              style={{
                top: t.top,
                left: t.left,
                width: t.s,
                height: t.s,
                animationDelay: t.d,
                clipPath: 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)',
              }}
            />
          ))}
        </>
      )}



      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {diamond ? (
            <div className="relative grid h-12 w-12 shrink-0 place-items-center transition-transform duration-500 group-hover:scale-110">
              <DiamondGem className="h-11 w-11" />
            </div>
          ) : (
            <GoldMedallion className="h-12 w-12 shrink-0 transition-transform duration-500 group-hover:scale-110" />
          )}
          <div className="min-w-0">
            <h2
              className={`text-lg leading-tight font-black ${
                diamond ? 'bg-[linear-gradient(100deg,#0369a1,#7e22ce,#be185d)] bg-clip-text text-transparent' : 'gold-text'
              }`}
            >
              {plan.name}
            </h2>
            <p className={`mt-0.5 text-[11px] ${diamond ? 'text-slate-600' : 'text-muted-foreground'}`}>{plan.tagline}</p>
          </div>
        </div>
        {diamond ? (
          <span className="chip-shimmer shrink-0 rounded-full border border-white/70 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-800">
            Diamond
          </span>
        ) : (
          <span className="gold-surface shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#5e3a04] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
            Gold
          </span>
        )}
      </div>

      <div className="relative mt-5 flex items-end gap-1">
        <span
          className={`text-4xl font-black tracking-tight ${
            diamond ? 'bg-[linear-gradient(100deg,#0369a1,#7e22ce,#be185d)] bg-clip-text text-transparent' : 'gold-text'
          }`}
        >
          {plan.price}
        </span>
        <span className={`pb-1.5 text-xs font-semibold ${diamond ? 'text-slate-600' : 'text-muted-foreground'}`}>/week</span>
      </div>


      {plan.includesNote && (
        <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-800">
          <Check className="h-3 w-3" strokeWidth={3.5} /> {plan.includesNote}
        </p>
      )}

      <ul className="relative mt-4 space-y-3 text-sm">
        {plan.perks.map((perk, i) => (
          <li
            key={perk.label}
            className="flex items-start gap-2.5 transition-transform duration-500 group-hover:translate-x-0.5"
            style={{ transitionDelay: `${i * 45}ms` }}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:scale-110 ${
                diamond ? 'bg-gradient-to-br from-sky-400 to-fuchsia-500 text-white' : 'bg-primary/12 text-primary'
              }`}
              style={{ transitionDelay: `${i * 45}ms` }}
            >
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span className="min-w-0">
              <span className={`block font-bold leading-snug ${diamond ? 'text-slate-900' : 'text-foreground'}`}>{perk.label}</span>
              <span className={`block text-[11.5px] leading-snug ${diamond ? 'text-slate-700' : 'text-muted-foreground'}`}>{perk.detail}</span>
            </span>
          </li>
        ))}
      </ul>


      {!hideCard && (
        <button
          onClick={onSubscribe}
          className={`press-spring relative mt-6 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-black tracking-tight ${
            diamond
              ? 'bg-[linear-gradient(110deg,#38bdf8,#a855f7,#ec4899,#38bdf8)] bg-[length:240%_100%] text-white shadow-glow hover:bg-[position:100%_50%]'
              : 'gold-surface text-[#4a2d02] shadow-[0_8px_20px_-8px_rgba(180,130,20,.8),inset_0_1px_0_rgba(255,255,255,.85)]'
          }`}

          style={diamond ? { transition: 'background-position 900ms ease, transform 320ms cubic-bezier(.2,1.3,.3,1)' } : undefined}
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2">
            {diamond ? <Gem className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            Pay by card · Get {plan.name}
          </span>
        </button>
      )}

      {/* Alternative rails: App Store / Google Play billing via RevenueCat plus
          the partner processors (Cash App Pay, CCBill, SegPay, Epoch). Always
          visible so members have a fast, international backup if card checkout
          is unavailable. */}
      <div className={hideCard ? 'mt-6' : 'mt-3'}>
        <RevenueCatPurchase priceId={plan.id as CrushPriceId} label={`Get ${plan.name} with store billing`} />
        {!hideCard && <AltPaymentOptions priceId={plan.id} onCashApp={onSubscribe} />}
      </div>

      </div>
    </div>
  );
}



function UpgradePage() {
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const iosRestricted = useIosBillingRestricted();
  const { available: storeBilling } = useRevenueCat();
  // Card checkout is hidden inside the iOS build (Apple guideline 3.1.1); the
  // store rail below stays available so members can still subscribe there.
  const hideCard = iosRestricted;
  return (
    <AppShell>
      <div className="page-anim relative">
        {/* aurora + bubbles atmosphere */}
        <div aria-hidden className="pointer-events-none absolute -inset-x-6 -top-10 h-72 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-64 w-64 rounded-full bg-primary/25 blur-3xl" style={{ animation: 'aurora-drift 16s ease-in-out infinite alternate' }} />
          <div className="absolute right-[-8%] top-6 h-56 w-56 rounded-full bg-accent/25 blur-3xl" style={{ animation: 'aurora-drift 20s ease-in-out infinite alternate-reverse' }} />
        </div>
        <Bubbles />

        <header className="relative mb-6 pt-2 rise-in">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
            <Sparkles className="h-3 w-3 text-primary" /> Membership
          </span>
          <h1 className="mt-3 text-[2rem] leading-[1.05] font-black">
            Upgrade your <span className="text-gradient-brand">Crush</span>
          </h1>
          <p className="mt-2 max-w-[34ch] text-sm text-muted-foreground">
            Weekly, cancel anytime. Gold opens the doors — Diamond makes rooms turn around.
          </p>
        </header>

        {iosRestricted && !storeBilling ? <AppStoreBillingNotice what="Crush Gold and Diamond VIP" /> : null}
        <div className={`relative space-y-5 ${iosRestricted && !storeBilling ? 'pointer-events-none mt-5 opacity-60' : ''}`}>
          {PLANS.map((p, i) => (
            <PlanCard
              key={p.id}
              plan={p}
              index={i}
              hideCard={hideCard}
              onSubscribe={() =>
                iosRestricted ? undefined : openCheckout(
                  { kind: 'catalog', priceId: p.id },
                  { title: p.name, subtitle: `${p.price} per week · cancel anytime`, diamond: p.diamond },
                )
              }
            />

          ))}
        </div>

        <div
          data-reveal
          className="relative mt-6 rounded-[1.5rem] border border-border/60 bg-card/60 p-4 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-xl"
        >
          Memberships are billed weekly in USD and renew automatically every week until you cancel. Cancel anytime from{' '}
          <Link to="/subscriptions" className="font-semibold text-primary story-link">My subscriptions</Link> — access continues to the end
          of the paid period, and unused memberships are refundable within 14 days. See our{' '}
          <Link to="/legal/refunds" className="font-semibold text-primary">Refund &amp; Cancellation Policy</Link>,{' '}
          <Link to="/legal/billing" className="font-semibold text-primary">Billing Terms</Link>,{' '}
          <Link to="/legal/terms" className="font-semibold text-primary">Terms</Link> and{' '}
          <Link to="/legal/privacy" className="font-semibold text-primary">Privacy Policy</Link>.
        </div>
        {checkoutElement}
      </div>
    </AppShell>
  );
}
