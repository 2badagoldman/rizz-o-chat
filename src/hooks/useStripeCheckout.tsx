import { useState, useCallback, useEffect } from 'react';
import { StripeEmbeddedCheckout, type CheckoutRequest } from '@/components/StripeEmbeddedCheckout';
import { X } from 'lucide-react';

type CheckoutMeta = { title?: string; subtitle?: string; diamond?: boolean };

export function useStripeCheckout() {
  const [request, setRequest] = useState<CheckoutRequest | null>(null);
  const [meta, setMeta] = useState<CheckoutMeta>({});
  const [closing, setClosing] = useState(false);

  const openCheckout = useCallback((r: CheckoutRequest, m: CheckoutMeta = {}) => {
    setMeta(m);
    setClosing(false);
    setRequest(r);
  }, []);

  const closeCheckout = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      setRequest(null);
      setClosing(false);
    }, 220);
    return () => clearTimeout(t);
  }, [closing]);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request]);

  const isOpen = request !== null;

  const checkoutElement = request ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title ?? 'Checkout'}
      // z-[200]: must sit above the welcome showcase overlay (z-[100]), which
      // otherwise covers the Stripe payment form and blocks every purchase.
      className={`fixed inset-0 z-[200] flex flex-col bg-background/90 backdrop-blur-xl ${closing ? 'overlay-out' : 'overlay-in'}`}
    >
      {/* ambient atmosphere so checkout matches the membership pages */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[-12%] top-[-10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl glow-breathe"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl glow-breathe"
        style={{ animationDelay: '1.4s' }}
      />

      <div
        className={`relative flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 ${
          closing ? 'sheet-out' : 'sheet-in'
        }`}
      >
        {meta.diamond && (
          <span
            aria-hidden
            className="prism-shift pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,.9)_35%,transparent_48%,rgba(125,211,252,.7)_60%,transparent_72%,rgba(244,114,182,.7)_84%,transparent_95%)]"
          />
        )}
        <div className="relative min-w-0">
          <p
            className={`truncate text-sm font-black tracking-tight ${
              meta.diamond ? 'bg-[linear-gradient(100deg,#0284c7,#a855f7,#ec4899)] bg-clip-text text-transparent' : ''
            }`}
          >
            {meta.title ?? 'Checkout'}
          </p>
          {meta.subtitle && <p className="truncate text-[11px] text-muted-foreground">{meta.subtitle}</p>}
        </div>
        <button
          onClick={closeCheckout}
          className="press-spring relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 bg-card/70 backdrop-blur-xl"
          aria-label="Close checkout"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className={`relative flex-1 overflow-auto ${closing ? 'sheet-out' : 'sheet-in'}`} style={{ animationDelay: closing ? '0ms' : '70ms' }}>
        <StripeEmbeddedCheckout {...request} />
      </div>
    </div>
  ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
