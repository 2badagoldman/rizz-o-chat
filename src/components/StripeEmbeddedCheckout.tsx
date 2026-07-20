import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import {
  createCheckoutSession,
  createFriendsListCheckout,
  createTipCheckout,
} from '@/utils/payments.functions';

export type CheckoutRequest =
  | { kind: 'catalog'; priceId: string; returnUrl?: string }
  | { kind: 'friends_list'; hostId: string; hostName: string; priceCents: number; returnUrl?: string }
  | { kind: 'tip'; hostId: string; hostName: string; amountCents: number; returnUrl?: string };

export function StripeEmbeddedCheckout(props: CheckoutRequest) {
  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl =
      props.returnUrl ?? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const environment = getStripeEnvironment();
    let result;
    if (props.kind === 'catalog') {
      result = await createCheckoutSession({ data: { priceId: props.priceId, returnUrl, environment } });
    } else if (props.kind === 'friends_list') {
      result = await createFriendsListCheckout({
        data: {
          hostId: props.hostId,
          hostName: props.hostName,
          priceCents: props.priceCents,
          returnUrl,
          environment,
        },
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
    if (!result.clientSecret) throw new Error('Stripe did not return a client secret');
    return result.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
