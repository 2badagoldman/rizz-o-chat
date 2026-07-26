import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Check, Gem, Star } from 'lucide-react';

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


const PLANS = [
  {
    id: 'rizz_gold_weekly',
    name: 'Rizz Gold',
    price: '$9.99',
    icon: Star,
    perks: ['Unlock any host Friends List', 'Unlimited discovery scroll', 'AI copilot boosts', 'Priority chat placement', 'No ads'],
  },
  {
    id: 'rizz_diamond_weekly',
    name: 'Rizz Diamond VIP',
    price: '$19.99',
    icon: Gem,
    diamond: true,
    perks: ['Unlocks Rizz Gold + Diamond tiers', 'Diamond badge on your profile', '2,000 coins every week', 'Top-of-list visibility', 'Early access to new hosts'],
  },
];

function UpgradePage() {
  const { openCheckout, checkoutElement } = useStripeCheckout();
  return (
    <AppShell>
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Membership</p>
        <h1 className="mt-1 text-2xl font-bold">Upgrade your Rizzla</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cancel anytime. Your week renews automatically.</p>
      </header>
      <div className="space-y-4">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const diamond = 'diamond' in p && p.diamond;
          return (
            <div
              key={p.id}
              className={
                diamond
                  ? 'relative overflow-hidden rounded-2xl border border-sky-300/60 bg-[linear-gradient(135deg,hsl(198_100%_96%),hsl(320_100%_97%)_45%,hsl(220_100%_95%))] p-5 shadow-glow'
                  : 'rounded-2xl border border-border bg-card p-5'
              }
            >
              {diamond && (
                <>
                  <span className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rotate-45 bg-gradient-to-br from-white/80 via-white/20 to-transparent blur-xl" />
                  <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-700 backdrop-blur">
                    Diamond
                  </span>
                </>
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={
                      diamond
                        ? 'grid h-11 w-11 rotate-45 place-items-center rounded-md bg-gradient-to-br from-sky-200 via-white to-pink-200 shadow-md ring-1 ring-white/70'
                        : 'grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary'
                    }
                  >
                    <Icon className={diamond ? '-rotate-45 h-5 w-5 text-sky-600' : 'h-5 w-5'} />
                  </div>
                  <h2 className={diamond ? 'text-lg font-black tracking-tight text-sky-900' : 'text-lg font-bold'}>{p.name}</h2>
                </div>
                <p className={diamond ? 'mt-6 text-lg font-bold text-sky-900' : 'text-lg font-bold'}>
                  {p.price}
                  <span className="text-xs font-normal text-muted-foreground">/week</span>
                </p>
              </div>
              <ul className="relative mt-4 space-y-2 text-sm">
                {p.perks.map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <Check className={diamond ? 'h-4 w-4 text-sky-600' : 'h-4 w-4 text-success'} /> {line}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openCheckout({ kind: 'catalog', priceId: p.id })}
                className={
                  diamond
                    ? 'relative mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-pink-500 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110'
                    : 'btn-brand mt-5 w-full'
                }
              >
                Subscribe to {p.name}
              </button>

            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl border border-border bg-card/60 p-4 text-[11px] leading-relaxed text-muted-foreground">
        Memberships are billed weekly in USD and renew automatically every week until you cancel. Cancel anytime from{' '}
        <Link to="/subscriptions" className="font-semibold text-primary">My subscriptions</Link> — access continues to the end
        of the paid period, and unused memberships are refundable within 14 days. See our{' '}
        <Link to="/legal/refunds" className="font-semibold text-primary">Refund &amp; Cancellation Policy</Link>,{' '}
        <Link to="/legal/billing" className="font-semibold text-primary">Billing Terms</Link>,{' '}
        <Link to="/legal/terms" className="font-semibold text-primary">Terms</Link> and{' '}
        <Link to="/legal/privacy" className="font-semibold text-primary">Privacy Policy</Link>.
      </div>
      {checkoutElement}
    </AppShell>
  );
}
