import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { CoinIcon } from '@/components/CoinIcon';
import { Sparkles } from 'lucide-react';
import rizzAiLogo from '@/assets/rizz-ai-logo.webp.asset.json';
import { pageHead } from "@/lib/seo";
import { useIosBillingRestricted } from '@/hooks/useNative';
import { AppStoreBillingNotice } from '@/components/AppStoreBillingNotice';

export const Route = createFileRoute('/coins')({
  head: () => pageHead({
    path: "/coins",
    title: "Buy coins \u2014 Rizz Social",
    description: "Top up your Rizz Social wallet with coins to send gifts, tip hosts, and unlock perks.",
  }),
  component: CoinsPage,
});

type Pack = {
  id: string;
  coins: number;
  price: string;
  label: string;
  variant: 'gold' | 'diamond';
  highlight?: boolean;
  bonus?: number;
};

const PACKS: Pack[] = [
  { id: 'coins_500_onetime', coins: 500, price: '$4.99', label: 'Starter', variant: 'gold' },
  { id: 'coins_1500_onetime', coins: 1500, price: '$9.99', label: 'Popular', variant: 'gold', highlight: true },
  { id: 'coins_5000_onetime', coins: 5000, price: '$24.99', label: 'Big spender', variant: 'diamond' },
  { id: 'coins_15000_onetime', coins: 15000, price: '$49.99', label: 'VIP · +10% bonus', variant: 'diamond', bonus: 1500 },
];

/** Falling coin confetti behind the header. */
function CoinRain() {
  const drops = [
    { left: '6%', size: 14, delay: '0s', dur: '6s', gold: true },
    { left: '22%', size: 10, delay: '1.2s', dur: '5s', gold: false },
    { left: '41%', size: 16, delay: '2.4s', dur: '6.8s', gold: true },
    { left: '58%', size: 11, delay: '0.6s', dur: '5.6s', gold: false },
    { left: '74%', size: 15, delay: '3.1s', dur: '6.2s', gold: true },
    { left: '89%', size: 9, delay: '1.9s', dur: '5.2s', gold: true },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-6 h-40 overflow-hidden">
      {drops.map((d) => (
        <span
          key={d.left}
          className={`coin-rain absolute top-0 rounded-full ring-1 ${
            d.gold
              ? 'bg-[conic-gradient(from_200deg,#b45309,#fde68a,#fffbeb,#f59e0b,#b45309)] ring-amber-300/70'
              : 'bg-[conic-gradient(from_200deg,#bae6fd,#ffffff,#f5d0fe,#e0f2fe)] ring-sky-200/80'
          }`}
          style={{ left: d.left, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.dur }}
        />
      ))}
    </div>
  );
}

function PackRow({ pack, index, onBuy }: { pack: Pack; index: number; onBuy: () => void }) {
  const diamond = pack.variant === 'diamond';
  return (
    <button
      data-reveal
      style={{ transitionDelay: `${index * 80}ms` }}
      onClick={onBuy}
      className={`press-spring group relative flex w-full items-center justify-between overflow-hidden rounded-[1.5rem] border p-4 text-left backdrop-blur-2xl ${
        pack.highlight
          ? 'border-amber-300/70 bg-amber-50/50 shadow-glow'
          : diamond
            ? 'border-sky-200/70 bg-white/45 shadow-card'
            : 'border-border/70 bg-card/70 shadow-card'
      }`}
    >
      {/* ambient treasure glow */}
      <span
        aria-hidden
        className={`glow-breathe pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full blur-3xl ${
          diamond ? 'bg-gradient-to-br from-sky-300/60 to-fuchsia-300/40' : 'bg-gradient-to-br from-amber-300/60 to-orange-300/35'
        }`}
      />
      {/* light sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
      />

      <div className="relative flex items-center gap-3.5">
        <CoinIcon variant={pack.variant} size={52} label={`${pack.coins} coins`} />
        <div>
          <p
            className={`value-glow text-lg font-black leading-none tracking-tight ${
              diamond
                ? 'bg-[linear-gradient(100deg,#0284c7,#a855f7,#ec4899)] bg-clip-text text-transparent'
                : 'bg-[linear-gradient(100deg,#b45309,#f59e0b,#fbbf24)] bg-clip-text text-transparent'
            }`}
          >
            {pack.coins.toLocaleString()} coins
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            {pack.highlight && <Sparkles className="h-3 w-3 text-amber-500" />}
            {pack.label}
          </p>
        </div>
      </div>

      <div className="relative text-right">
        <p className="text-base font-black tracking-tight">{pack.price}</p>
        {pack.bonus ? (
          <p className="chip-shimmer mt-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
            +{pack.bonus.toLocaleString()} bonus
          </p>
        ) : null}
      </div>
    </button>
  );
}

function CoinsPage() {
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const iosRestricted = useIosBillingRestricted();
  return (
    <AppShell>
      <div className="page-anim relative">
        <CoinRain />
        <header className="relative mb-6 pt-1 rise-in">
          <span className="eyebrow">
            <Sparkles className="h-3 w-3 text-amber-500" /> Wallet
          </span>
          <h1 className="mt-3 flex items-center gap-3 text-[2rem] leading-[1.05] font-black">
            <CoinIcon variant="gold" size={44} />
            <span className="bg-[linear-gradient(100deg,#b45309,#f59e0b,#fde68a,#f59e0b)] bg-[length:220%_100%] bg-clip-text text-transparent gold-sweep">
              Buy coins
            </span>
          </h1>
          <p className="mt-2 max-w-[34ch] text-sm text-muted-foreground">
            Gold for gifts and tips. Diamond packs for the big moments — coins land instantly.
          </p>
        </header>

        {iosRestricted ? (
          <AppStoreBillingNotice what="Coin packs" />
        ) : (
          <div className="relative space-y-3">
            {PACKS.map((p, i) => (
              <PackRow key={p.id} pack={p} index={i} onBuy={() => openCheckout({ kind: 'catalog', priceId: p.id })} />
            ))}
          </div>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <img src={rizzAiLogo.url} alt="" className="h-3.5 w-3.5 rounded-full" /> Coins are added to your wallet instantly after payment.
        </p>
        <div className="mt-3 rounded-2xl border border-border/70 bg-card/60 p-4 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-xl">
          One-time purchase in USD, tax shown at checkout. Card statements read <b className="text-foreground">RIZZLA CHAT</b>.
          Coins are a licence to use in-app features, not cash, and cannot be transferred or withdrawn. Unused coins are
          refundable within 14 days — see our{' '}
          <Link to="/legal/refunds" className="font-semibold text-primary">Refund Policy</Link>,{' '}
          <Link to="/legal/billing" className="font-semibold text-primary">Billing Terms</Link> and{' '}
          <Link to="/legal/terms" className="font-semibold text-primary">Terms</Link>. By paying you agree to them.
        </div>
        {checkoutElement}
      </div>
    </AppShell>
  );
}

