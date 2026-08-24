import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, ExternalLink, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { PAYMENT_PARTNERS, type PartnerId, type PartnerStatus } from '@/lib/payment-partners';
import { createPartnerCheckout, getPartnerStatus } from '@/lib/alt-payments.functions';

/**
 * Extra "pay with…" buttons rendered beneath the Stripe card checkout.
 *
 * Only partners whose credentials are configured on the server show up, so
 * this component is safe to ship before the merchant accounts are approved.
 */
export function AltPaymentOptions({
  priceId,
  onCashApp,
  className = '',
}: {
  priceId: string;
  /** Cash App Pay runs inside the existing Stripe checkout. */
  onCashApp?: () => void;
  className?: string;
}) {
  const { user } = useAuth();
  const status = useServerFn(getPartnerStatus);
  const startCheckout = useServerFn(createPartnerCheckout);
  const [partners, setPartners] = useState<PartnerStatus[]>([]);
  const [busy, setBusy] = useState<PartnerId | null>(null);

  useEffect(() => {
    let alive = true;
    status({})
      .then((rows) => alive && setPartners(rows))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [status]);

  // Only the primary rail is offered. Backup processors stay configured but
  // hidden so checkout never presents a wall of choices.
  const stripePrimary = !partners.some((p) => p.enabled && p.primary && p.id !== 'cashapp');
  const enabled = partners.filter(
    (p) => p.enabled && (p.primary || (p.id === 'cashapp' && stripePrimary)),
  );
  if (enabled.length === 0) return null;

  async function pay(id: PartnerId) {
    if (id === 'cashapp') {
      onCashApp?.();
      return;
    }
    if (!user?.id) {
      toast.error('Sign in first so we can credit your account.');
      return;
    }
    setBusy(id);
    try {
      const result = await startCheckout({
        data: { partner: id, priceId, returnUrl: window.location.href },
      });
      if ('error' in result) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start that payment');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`mt-2 flex flex-wrap gap-2 ${className}`}>
      {enabled.map((row) => {
        const meta = PAYMENT_PARTNERS.find((p) => p.id === row.id);
        if (!meta) return null;
        const working = busy === row.id;
        // When a hosted processor is the primary rail it IS the checkout
        // button, so it gets full-width prominence instead of a small pill.
        const lead = row.primary && meta.kind === 'hosted';
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => pay(row.id)}
            disabled={working}
            title={meta.blurb}
            className={
              lead
                ? 'press-spring inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground disabled:opacity-60'
                : 'press-spring inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[11px] font-bold text-foreground backdrop-blur-xl disabled:opacity-60'
            }
          >
            {working ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : meta.kind === 'stripe' ? (
              <Smartphone className="h-3 w-3" />
            ) : (
              <ExternalLink className="h-3 w-3" />
            )}
            {lead ? `Pay securely with ${meta.label}` : meta.label}
          </button>
        );
      })}
    </div>
  );
}
