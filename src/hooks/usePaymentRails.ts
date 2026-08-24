import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getPaymentRails } from '@/lib/alt-payments.functions';
import type { PaymentRails } from '@/lib/payment-partners';

/**
 * Which card rail checkout should use. Stripe closed the account for
 * dating/companionship, so as soon as a high-risk processor (CCBill, SegPay,
 * Epoch) has credentials it becomes the single visible rail and Stripe hides.
 */
export function usePaymentRails() {
  const load = useServerFn(getPaymentRails);
  const [rails, setRails] = useState<PaymentRails | null>(null);

  useEffect(() => {
    let alive = true;
    load({})
      .then((r) => alive && setRails(r))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [load]);

  const primary = rails?.primary ?? 'stripe';
  return {
    rails,
    primary,
    /** Stripe embedded checkout should render. */
    stripeCard: primary === 'stripe' && (rails?.stripeAccepting ?? true),
    loading: rails === null,
  };
}
