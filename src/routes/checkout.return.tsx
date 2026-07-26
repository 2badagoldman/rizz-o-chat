import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { Check, Gem, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/checkout/return')({
  head: () => ({
    meta: [
      { title: 'Payment complete — Rizzla' },
      { name: 'description', content: 'Your Rizzla membership or coin purchase is confirmed. Access unlocks in seconds.' },
      { property: 'og:title', content: 'Payment complete — Rizzla' },
      { property: 'og:description', content: 'Your Rizzla membership or coin purchase is confirmed.' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

const NEXT_STEPS = [
  { label: 'Friends Lists are open', detail: 'Unlock any host and jump straight into their chat.' },
  { label: 'Perks are live', detail: 'Badges, coin drops and priority placement apply instantly.' },
  { label: 'Manage anytime', detail: 'Cancel or switch plans from My subscriptions — no lock-in.' },
];

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const ok = !!session_id;

  return (
    <AppShell hideDock>
      <div className="page-anim relative">
        {/* aurora atmosphere */}
        <div aria-hidden className="pointer-events-none absolute -inset-x-6 -top-12 h-80 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-64 w-64 rounded-full bg-primary/25 blur-3xl" style={{ animation: 'aurora-drift 16s ease-in-out infinite alternate' }} />
          <div className="absolute right-[-8%] top-6 h-56 w-56 rounded-full bg-accent/25 blur-3xl" style={{ animation: 'aurora-drift 20s ease-in-out infinite alternate-reverse' }} />
        </div>

        <div className="relative mt-10 p-[1.5px] rounded-[1.9rem] overflow-hidden">
          <span
            aria-hidden
            className="facet-spin pointer-events-none absolute left-1/2 top-1/2 h-[190%] w-[190%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,#38bdf8,#ffffff,#a855f7,#ffffff,#ec4899,#ffffff,#38bdf8)] opacity-90"
          />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/50 p-7 text-center shadow-pop backdrop-blur-2xl">
            {/* diamond caustics + holographic sheet */}
            <span
              aria-hidden
              className="caustic pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_20%_20%,rgba(56,189,248,.45),transparent_70%),radial-gradient(45%_40%_at_85%_30%,rgba(236,72,153,.4),transparent_70%),radial-gradient(60%_50%_at_50%_100%,rgba(168,85,247,.4),transparent_70%)] blur-2xl"
            />
            <span
              aria-hidden
              className="prism-shift pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,.9)_35%,transparent_48%,rgba(125,211,252,.7)_60%,transparent_72%,rgba(244,114,182,.7)_84%,transparent_95%)]"
            />
            <span aria-hidden className="sheen-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" />
            {[
              { top: '14%', left: '80%', s: 10, d: '0s' },
              { top: '62%', left: '10%', s: 8, d: '1.1s' },
              { top: '84%', left: '66%', s: 12, d: '2.1s' },
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

            {/* animated diamond seal */}
            <div className="relative mx-auto grid h-20 w-20 place-items-center">
              <span aria-hidden className="ring-pulse absolute inset-0 rounded-[1.4rem] rotate-45 border border-sky-300/70" />
              <span
                aria-hidden
                className="ring-pulse absolute inset-0 rounded-[1.4rem] rotate-45 border border-fuchsia-300/70"
                style={{ animationDelay: '1.3s' }}
              />
              <div className="seal-pop relative grid h-16 w-16 rotate-45 place-items-center rounded-[1.15rem] bg-gradient-to-br from-sky-200 via-white to-pink-200 shadow-lg ring-1 ring-white/80">
                {ok ? (
                  <Check className="-rotate-45 h-7 w-7 text-sky-600" strokeWidth={3.5} />
                ) : (
                  <Sparkles className="-rotate-45 h-7 w-7 text-sky-600" />
                )}
              </div>
            </div>

            <h1 className="relative mt-6 text-[1.7rem] leading-tight font-black bg-[linear-gradient(100deg,#0284c7,#a855f7,#ec4899)] bg-clip-text text-transparent">
              {ok ? "You're all set" : 'Almost there'}
            </h1>
            <p className="relative mx-auto mt-2 max-w-[36ch] text-sm text-muted-foreground">
              {ok
                ? 'Payment confirmed. Your access is unlocking right now — coins, memberships and Friends Lists appear within a few seconds.'
                : 'We could not find your session details, but your payment may still be processing. Check My subscriptions in a moment.'}
            </p>

            {ok && (
              <ul className="relative mx-auto mt-6 max-w-sm space-y-3 text-left">
                {NEXT_STEPS.map((s, i) => (
                  <li
                    key={s.label}
                    className="rise-in flex items-start gap-2.5"
                    style={{ animationDelay: `${240 + i * 110}ms` }}
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-fuchsia-500 text-white">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-snug text-foreground">{s.label}</span>
                      <span className="block text-[11.5px] leading-snug text-muted-foreground">{s.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="relative mt-7 flex flex-col gap-2.5">
              <Link
                to="/discover"
                className="press-spring relative w-full overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#38bdf8,#a855f7,#ec4899,#38bdf8)] bg-[length:240%_100%] py-3.5 text-sm font-black tracking-tight text-white shadow-glow hover:bg-[position:100%_50%]"
                style={{ transition: 'background-position 900ms ease, transform 320ms cubic-bezier(.2,1.3,.3,1)' }}
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  <Gem className="h-4 w-4" /> Start meeting hosts
                </span>
              </Link>
              <div className="flex gap-2.5">
                <Link
                  to="/dashboard"
                  className="press-spring flex-1 rounded-2xl border border-border/70 bg-card/70 py-3 text-center text-sm font-semibold backdrop-blur-xl"
                >
                  Dashboard
                </Link>
                <Link
                  to="/subscriptions"
                  className="press-spring flex-1 rounded-2xl border border-border/70 bg-card/70 py-3 text-center text-sm font-semibold backdrop-blur-xl"
                >
                  My subscriptions
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="relative mx-auto mt-5 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
          Memberships renew weekly until cancelled. See our{' '}
          <Link to="/legal/refunds" className="font-semibold text-primary">Refund &amp; Cancellation Policy</Link> and{' '}
          <Link to="/legal/billing" className="font-semibold text-primary">Billing Terms</Link>.
        </p>
      </div>
    </AppShell>
  );
}
