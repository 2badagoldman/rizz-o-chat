import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Check, Crown, Star } from 'lucide-react';

export const Route = createFileRoute('/upgrade')({
  head: () => ({
    meta: [
      { title: 'Upgrade to Rizz+ or VIP — Rizz Social' },
      { name: 'description', content: 'Unlock unlimited discovery, priority chat, a VIP badge, and monthly coin drops on Rizz Social.' },
      { property: 'og:title', content: 'Upgrade to Rizz+ or VIP — Rizz Social' },
      { property: 'og:description', content: 'Unlock unlimited discovery, priority chat, and monthly coin drops.' },
      { property: 'og:url', content: 'https://rizzlachat.com/upgrade' },
    ],
    links: [{ rel: 'canonical', href: 'https://rizzlachat.com/upgrade' }],
  }),
  component: UpgradePage,
});


const PLANS = [
  {
    id: 'rizz_plus_monthly',
    name: 'Rizz+',
    price: '$9.99',
    icon: Star,
    perks: ['Unlimited discovery scroll', 'AI copilot boosts', 'Priority chat placement', 'No ads'],
  },
  {
    id: 'rizz_vip_monthly',
    name: 'Rizz VIP',
    price: '$19.99',
    icon: Crown,
    highlight: true,
    perks: ['Everything in Rizz+', 'VIP badge on your profile', '2,000 coins every month', 'Top-of-list visibility', 'Early access to new hosts'],
  },
];

function UpgradePage() {
  const { openCheckout, checkoutElement } = useStripeCheckout();
  return (
    <AppShell>
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Membership</p>
        <h1 className="mt-1 text-2xl font-bold">Upgrade your Rizzla</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cancel anytime. Your monthly renews automatically.</p>
      </header>
      <div className="space-y-4">
        {PLANS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 ${p.highlight ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{p.name}</h2>
                </div>
                <p className="text-lg font-bold">
                  {p.price}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.perks.map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> {line}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openCheckout({ kind: 'catalog', priceId: p.id })}
                className="btn-brand mt-5 w-full"
              >
                Subscribe to {p.name}
              </button>
            </div>
          );
        })}
      </div>
      {checkoutElement}
    </AppShell>
  );
}
