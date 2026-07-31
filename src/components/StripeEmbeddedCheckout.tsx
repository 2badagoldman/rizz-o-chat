import { useCallback, useEffect, useRef, useState } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { AlertCircle, RefreshCw, Ticket } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import {
  createCheckoutSession,
  createFriendsListCheckout,
  createTipCheckout,
} from '@/utils/payments.functions';
import { createGuestCheckoutSession } from '@/lib/guest-checkout.functions';
import { GUEST_PLAN_IDS, rememberGuestCode, normalizePhone } from '@/lib/guest-checkout';

export type CheckoutRequest =
  | { kind: 'catalog'; priceId: string; returnUrl?: string }
  | { kind: 'friends_list'; hostId: string; hostName: string; returnUrl?: string }
  | { kind: 'tip'; hostId: string; hostName: string; amountCents: number; returnUrl?: string };

function describe(props: CheckoutRequest) {
  if (props.kind === 'catalog') return `catalog:${props.priceId}`;
  if (props.kind === 'friends_list') return `friends_list:${props.hostId}`;
  return `tip:${props.hostId}:${props.amountCents}`;
}


export function StripeEmbeddedCheckout(props: CheckoutRequest) {
  // `attempt` remounts the Stripe provider on retry — a provider cannot reuse
  // a client secret, so retrying requires a fresh mount.
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const failedRef = useRef(false);
  // Checkout server fns require a Supabase bearer token. Resolve the session
  // before mounting Stripe so a signed-out user sees a sign-in prompt instead
  // of an unhandled "No authorization header provided" crash.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSignedIn(Boolean(data.session?.access_token));
    });
    return () => {
      alive = false;
    };
  }, [attempt]);

  // Guest checkout (no account): allowed for membership plans only.
  const guestEligible = props.kind === 'catalog' && (GUEST_PLAN_IDS as readonly string[]).includes(props.priceId);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');


  // getStripe() throws when VITE_PAYMENTS_CLIENT_TOKEN is missing/unrecognized,
  // which would blow up render before fetchClientSecret ever runs.
  let stripePromise: ReturnType<typeof getStripe> | null = null;
  let configError: string | null = null;
  try {
    stripePromise = getStripe();
  } catch (err) {
    configError = err instanceof Error ? err.message : String(err);
  }


  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const returnUrl =
      props.returnUrl ?? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const target = describe(props);
    let environment: ReturnType<typeof getStripeEnvironment>;
    try {
      environment = getStripeEnvironment();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[checkout] ${target}: payments not configured — ${message}`);
      failedRef.current = true;
      setFailure(message);
      throw err;
    }

    console.info(`[checkout] ${target}: requesting session (env=${environment}, attempt=${attempt + 1})`);
    try {
      let result;
      if (guestEmail && props.kind === 'catalog') {
        const guest = await createGuestCheckoutSession({
          data: { priceId: props.priceId, email: guestEmail, phone: guestPhone ?? undefined, returnUrl, environment },
        });
        if ('code' in guest) rememberGuestCode(guest.code);
        result = guest;
      } else if (props.kind === 'catalog') {
        result = await createCheckoutSession({ data: { priceId: props.priceId, returnUrl, environment } });
      } else if (props.kind === 'friends_list') {
        result = await createFriendsListCheckout({
          data: { hostId: props.hostId, hostName: props.hostName, returnUrl, environment },
        });
      } else {
        result = await createTipCheckout({
          data: {
            hostId: props.hostId,
            hostName: props.hostName,
            amountCents: props.amountCents,
            returnUrl,
            environment,
          },
        });
      }


      if ('error' in result) throw new Error(result.error);
      if (!result.clientSecret) throw new Error('Stripe did not return a client secret.');

      console.info(`[checkout] ${target}: session created`);
      return result.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Full detail in the console for debugging; short message in the UI.
      console.error(`[checkout] ${target}: failed to create session (env=${environment}) — ${message}`, err);
      failedRef.current = true;
      setFailure(
        /unauthor|authorization header|401/i.test(message)
          ? 'You need to be signed in to complete this purchase.'
          : message,
      );
      throw err;
    }

  }, [props, attempt, guestEmail, guestPhone]);

  const retry = () => {
    failedRef.current = false;
    setFailure(null);
    setAttempt((n) => n + 1);
  };

  if (signedIn === false && !configError && !guestEmail) {
    if (!guestEligible) {
      return (
        <div className="mx-auto max-w-md px-5 py-10 text-center">
          <h2 className="text-base font-black tracking-tight">Sign in to continue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to be signed in to complete this purchase.
          </p>
          <Link
            to="/auth"
            className="press-spring mt-5 inline-flex items-center rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-semibold backdrop-blur-xl"
          >
            Sign in
          </Link>
        </div>
      );
    }
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = emailDraft.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            setFailure('Enter a valid email address.');
            return;
          }
          const phone = phoneDraft.trim();
          if (phone && !normalizePhone(phone)) {
            setFailure('Enter a valid phone number.');
            return;
          }
          setFailure(null);
          setGuestPhone(phone ? normalizePhone(phone) : null);
          setGuestEmail(email);
        }}
        className="mx-auto max-w-md px-5 py-10 text-center"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border/70 bg-card/70">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        <h2 className="mt-4 text-base font-black tracking-tight">Subscribe now, sign up after</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay as a guest and we&apos;ll give you a subscription code. Sign up later with the same email or phone
          and your membership attaches automatically.
        </p>
        <input
          type="email"
          required
          value={emailDraft}
          onChange={(e) => setEmailDraft(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email for your receipt and subscription code"
          className="mt-5 w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm font-semibold outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="tel"
          inputMode="tel"
          value={phoneDraft}
          onChange={(e) => setPhoneDraft(e.target.value)}
          placeholder="Phone number (optional)"
          aria-label="Phone number so we can match your subscription when you sign up"
          className="mt-2 w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm font-semibold outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-ring"
        />
        {failure && <p className="mt-2 text-xs font-semibold text-destructive">{failure}</p>}
        <button
          type="submit"
          className="press-spring mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground"
        >
          Continue to payment
        </button>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth" className="font-semibold text-primary">
            Sign in
          </Link>{' '}
          for instant access.
        </p>
      </form>
    );
  }


  if (signedIn === null && !configError) {
    return <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading checkout…</div>;
  }

  const problem = configError ?? failure;
  if (problem || !stripePromise) {
    if (configError) console.error(`[checkout] ${describe(props)}: Stripe.js unavailable — ${configError}`);
    return (
      <div className="mx-auto max-w-md px-5 py-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="mt-4 text-base font-black tracking-tight">Checkout couldn&apos;t start</h2>
        <p className="mt-2 text-sm text-muted-foreground">{problem ?? 'Payments are unavailable right now.'}</p>
        {!configError && (
          <button
            onClick={retry}
            className="press-spring mt-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-semibold backdrop-blur-xl"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Still stuck? Email rizzchatsupport@gmail.com with the message above.
        </p>
      </div>
    );
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider key={attempt} stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );

}
