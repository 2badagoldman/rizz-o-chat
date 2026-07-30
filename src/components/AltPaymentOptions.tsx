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

  const enabled = partners.filter((p) => p.enabled);
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
        data: { partner: id, priceId, userId: user.id, returnUrl: window.location.href },
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
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => pay(row.id)}
            disabled={working}
            title={meta.blurb}
            className="press-spring inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[11px] font-bold text-foreground backdrop-blur-xl disabled:opacity-60"
          >
            {working ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : meta.kind === 'stripe' ? (
              <Smartphone className="h-3 w-3" />
            ) : (
              <ExternalLink className="h-3 w-3" />
            )}
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
