import { useState, useCallback } from 'react';
import { StripeEmbeddedCheckout, type CheckoutRequest } from '@/components/StripeEmbeddedCheckout';

export function useStripeCheckout() {
  const [request, setRequest] = useState<CheckoutRequest | null>(null);
  const openCheckout = useCallback((r: CheckoutRequest) => setRequest(r), []);
  const closeCheckout = useCallback(() => setRequest(null), []);
  const isOpen = request !== null;

  const checkoutElement = request ? (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Checkout</p>
        <button
          onClick={closeCheckout}
          className="rounded-full border border-border px-3 py-1 text-xs"
          aria-label="Close checkout"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <StripeEmbeddedCheckout {...request} />
      </div>
    </div>
  ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
