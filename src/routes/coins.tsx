import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Coins } from 'lucide-react';
import rizzAiLogo from '@/assets/rizz-ai-logo.webp.asset.json';

export const Route = createFileRoute('/coins')({
  head: () => ({
    meta: [
      { title: 'Buy coins — Rizz Social' },
      { name: 'description', content: 'Top up your Rizz Social wallet with coins to send gifts, tip hosts, and unlock perks.' },
      { property: 'og:title', content: 'Buy coins — Rizz Social' },
      { property: 'og:description', content: 'Top up your wallet to send gifts and unlock perks.' },
      { property: 'og:url', content: 'https://rizzlachat.com/coins' },
    ],
    links: [{ rel: 'canonical', href: 'https://rizzlachat.com/coins' }],
  }),
  component: CoinsPage,
});


const PACKS = [
  { id: 'coins_500_onetime', coins: 500, price: '$4.99', label: 'Starter' },
  { id: 'coins_1500_onetime', coins: 1500, price: '$9.99', label: 'Popular', highlight: true },
  { id: 'coins_5000_onetime', coins: 5000, price: '$24.99', label: 'Big spender' },
  { id: 'coins_15000_onetime', coins: 15000, price: '$49.99', label: 'VIP · +10% bonus', bonus: 1500 },
];

function CoinsPage() {
  const { openCheckout, checkoutElement } = useStripeCheckout();
  return (
    <AppShell>
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Wallet</p>
        <h1 className="mt-1 text-2xl font-bold">Buy coins</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send gifts, unlock premium chats, and tip your favorite hosts.
        </p>
      </header>
      <div className="space-y-3">
        {PACKS.map((p) => (
          <button
            key={p.id}
            onClick={() => openCheckout({ kind: 'catalog', priceId: p.id })}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${p.highlight ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card'}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold">{p.coins.toLocaleString()} coins</p>
                <p className="text-xs text-muted-foreground">{p.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold">{p.price}</p>
              {p.bonus ? <p className="text-[11px] text-success">+{p.bonus} bonus</p> : null}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <img src={rizzAiLogo.url} alt="" className="h-3.5 w-3.5 rounded-full" /> Coins are added to your wallet instantly after payment.
      </p>
      <div className="mt-3 rounded-2xl border border-border bg-card/60 p-4 text-[11px] leading-relaxed text-muted-foreground">
        One-time purchase in USD, tax shown at checkout. Card statements read <b className="text-foreground">RIZZLA CHAT</b>.
        Coins are a licence to use in-app features, not cash, and cannot be transferred or withdrawn. Unused coins are
        refundable within 14 days — see our{' '}
        <Link to="/legal/refunds" className="font-semibold text-primary">Refund Policy</Link>,{' '}
        <Link to="/legal/billing" className="font-semibold text-primary">Billing Terms</Link> and{' '}
        <Link to="/legal/terms" className="font-semibold text-primary">Terms</Link>. By paying you agree to them.
      </div>
      {checkoutElement}

    </AppShell>
  );
}
