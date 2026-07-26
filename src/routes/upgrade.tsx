import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Check, Gem, Sparkles, Star, Zap } from 'lucide-react';

export const Route = createFileRoute('/upgrade')({
  head: () => ({
    meta: [
      { title: 'Upgrade to Rizz Gold or Diamond VIP — Rizz Social' },
      { name: 'description', content: 'Rizz Gold $9.99/week unlocks any Friends List. Rizz Diamond VIP $19.99/week adds a diamond badge and weekly coin drops.' },
      { property: 'og:title', content: 'Upgrade to Rizz Gold or Diamond VIP — Rizz Social' },
      { property: 'og:description', content: 'Weekly memberships: unlock Friends Lists, priority chat and weekly coin drops.' },
      { property: 'og:url', content: 'https://rizzlachat.com/upgrade' },
    ],
    links: [{ rel: 'canonical', href: 'https://rizzlachat.com/upgrade' }],
  }),
  component: UpgradePage,
});

type Plan = {
  id: string;
  name: string;
  price: string;
  tagline: string;
  icon: typeof Star;
  diamond?: boolean;
  perks: string[];
};

const PLANS: Plan[] = [
  {
    id: 'rizz_gold_weekly',
    name: 'Rizz Gold',
    price: '$9.99',
    tagline: 'The key that opens every Friends List',
    icon: Star,
    perks: ['Unlock any host Friends List', 'Unlimited discovery scroll', 'AI copilot boosts', 'Priority chat placement', 'No ads'],
  },
  {
    id: 'rizz_diamond_weekly',
    name: 'Rizz Diamond VIP',
    price: '$19.99',
    tagline: 'Gold + Diamond, unlocked together',
    icon: Gem,
    diamond: true,
    perks: ['Unlocks Rizz Gold + Diamond tiers', 'Diamond badge on your profile', '2,000 coins every week', 'Top-of-list visibility', 'Early access to new hosts'],
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

function PlanCard({ plan, index, onSubscribe }: { plan: Plan; index: number; onSubscribe: () => void }) {
  const Icon = plan.icon;
  const diamond = !!plan.diamond;
  return (
    <div
      data-reveal
      style={{ transitionDelay: `${index * 90}ms` }}
      className={`press-spring group relative overflow-hidden rounded-[1.75rem] p-6 backdrop-blur-2xl ${
        diamond
          ? 'border border-white/50 bg-white/45 shadow-pop'
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
          <span aria-hidden className="sheen-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/70" />
          <span
            aria-hidden
            className="facet-spin pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-[2rem] bg-[conic-gradient(from_0deg,rgba(255,255,255,.75),rgba(125,211,252,.35),rgba(244,114,182,.35),rgba(255,255,255,.75))] opacity-40 blur-2xl"
          />
        </>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`relative grid place-items-center transition-transform duration-500 group-hover:scale-110 ${
              diamond
                ? 'h-12 w-12 rotate-45 rounded-[0.85rem] bg-gradient-to-br from-sky-200 via-white to-pink-200 shadow-lg ring-1 ring-white/80'
                : 'h-12 w-12 rounded-2xl bg-gradient-brand-soft ring-1 ring-primary/20'
            }`}
          >
            <Icon className={diamond ? '-rotate-45 h-5 w-5 text-sky-600' : 'h-5 w-5 text-primary'} />
          </div>
          <div>
            <h2 className={`text-lg leading-tight ${diamond ? 'text-gradient-brand font-black' : 'font-extrabold'}`}>{plan.name}</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{plan.tagline}</p>
          </div>
        </div>
        {diamond && (
          <span className="chip-shimmer shrink-0 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
            Diamond
          </span>
        )}
      </div>

      <div className="relative mt-5 flex items-end gap-1">
        <span className={`text-4xl font-black tracking-tight ${diamond ? 'text-gradient-brand' : ''}`}>{plan.price}</span>
        <span className="pb-1.5 text-xs font-semibold text-muted-foreground">/week</span>
      </div>

      <ul className="relative mt-5 space-y-2.5 text-sm">
        {plan.perks.map((line, i) => (
          <li
            key={line}
            className="flex items-center gap-2.5 transition-transform duration-300 group-hover:translate-x-0.5"
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                diamond ? 'bg-gradient-to-br from-sky-400 to-fuchsia-500 text-white' : 'bg-primary/12 text-primary'
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSubscribe}
        className={`press-spring relative mt-6 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-black tracking-tight ${
          diamond
            ? 'bg-[linear-gradient(110deg,#38bdf8,#a855f7,#ec4899,#38bdf8)] bg-[length:240%_100%] text-white shadow-glow hover:bg-[position:100%_50%]'
            : 'btn-brand'
        }`}
        style={diamond ? { transition: 'background-position 900ms ease, transform 320ms cubic-bezier(.2,1.3,.3,1)' } : undefined}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {diamond ? <Gem className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          Get {plan.name}
        </span>
      </button>
    </div>
  );
}

function UpgradePage() {
  const { openCheckout, checkoutElement } = useStripeCheckout();
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
            Upgrade your <span className="text-gradient-brand">Rizzla</span>
          </h1>
          <p className="mt-2 max-w-[34ch] text-sm text-muted-foreground">
            Weekly, cancel anytime. Gold opens the doors — Diamond makes rooms turn around.
          </p>
        </header>

        <div className="relative space-y-5">
          {PLANS.map((p, i) => (
            <PlanCard key={p.id} plan={p} index={i} onSubscribe={() => openCheckout({ kind: 'catalog', priceId: p.id })} />
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
