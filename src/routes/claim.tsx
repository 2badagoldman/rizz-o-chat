import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { AppShell } from '@/components/AppShell';
import { Check, Loader2, Ticket } from 'lucide-react';
import { pageHead } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { getStripeEnvironment } from '@/lib/stripe';
import { claimGuestSubscription } from '@/lib/guest-checkout.functions';
import { clearGuestCode, readGuestCode } from '@/lib/guest-checkout';

export const Route = createFileRoute('/claim')({
  head: () =>
    pageHead({
      path: '/claim',
      title: 'Redeem your subscription code — Crush',
      description:
        'Paid before creating an account? Enter your Crush subscription code to attach your membership to your new profile.',
    }),
  component: ClaimPage,
});

function ClaimPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const claim = useServerFn(claimGuestSubscription);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'plus' | 'vip' | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  const submit = useCallback(
    async (raw: string) => {
      const value = raw.trim().toUpperCase();
      if (!value) return;
      setBusy(true);
      setError(null);
      try {
        const res = await claim({ data: { code: value, environment: getStripeEnvironment() } });
        if ('error' in res) setError(res.error);
        else {
          clearGuestCode();
          setDone(res.tier);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not redeem that code.');
      } finally {
        setBusy(false);
      }
    },
    [claim],
  );

  // Auto-redeem the code we stashed during guest checkout.
  useEffect(() => {
    if (loading || !user || autoTried) return;
    setAutoTried(true);
    const stored = readGuestCode();
    if (stored) {
      setCode(stored);
      void submit(stored);
    }
  }, [loading, user, autoTried, submit]);

  return (
    <AppShell>
      <div className="page-anim mx-auto max-w-md pt-6">
        <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-6 text-center shadow-card backdrop-blur-2xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border/70 bg-card/70">
            {done ? <Check className="h-5 w-5 text-primary" strokeWidth={3} /> : <Ticket className="h-5 w-5 text-primary" />}
          </div>
          <h1 className="mt-4 text-xl font-black tracking-tight">
            {done ? 'Membership activated' : 'Redeem your subscription code'}
          </h1>

          {done ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {done === 'vip' ? 'Crush Diamond VIP' : 'Crush Gold'} is now attached to your account.
              </p>
              <button
                onClick={() => router.navigate({ to: '/discover' })}
                className="press-spring mt-5 w-full rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground"
              >
                Start meeting creators
              </button>
            </>
          ) : !loading && !user ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your account or sign in first — then we&apos;ll attach the subscription you already paid for.
              </p>
              <Link
                to="/auth"
                search={{ next: '/claim' }}
                className="press-spring mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground"
              >
                Continue to sign up
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the code from your payment confirmation (it looks like CRUSH-AB12-CD34).
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(code);
                }}
              >
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CRUSH-XXXX-XXXX"
                  aria-label="Subscription code"
                  className="mt-5 w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-center text-base font-black tracking-[0.12em] outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-ring"
                />
                {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="press-spring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Redeem code
                </button>
              </form>
            </>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Lost your code? Email rizzchatsupport@gmail.com with the email you paid with and we&apos;ll resend it.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
