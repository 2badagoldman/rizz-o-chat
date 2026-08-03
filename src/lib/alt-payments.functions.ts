/**
 * Alternative payment rails: availability + hosted checkout hand-off.
 *
 * Each partner is enabled purely by the presence of its credentials, so the
 * buttons appear on /upgrade and /coins the moment the secrets are saved —
 * no code change needed to go live.
 */
import { createServerFn } from '@tanstack/react-start';
import type { PartnerId, PartnerStatus } from '@/lib/payment-partners';
import { CATALOG } from '@/lib/payment-partners';

function jsonMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function partnerConfigured(id: PartnerId): boolean {
  switch (id) {
    case 'ccbill':
      return Boolean(process.env.CCBILL_ACCOUNT && process.env.CCBILL_FLEXFORM_MAP);
    case 'segpay':
      return Boolean(process.env.SEGPAY_PACKAGE_MAP);
    case 'epoch':
      return Boolean(process.env.EPOCH_CO_CODE && process.env.EPOCH_PI_MAP);
    case 'cashapp':
      // Rides on the existing Stripe checkout; opt-in via a flag so it can be
      // hidden until Cash App Pay is switched on for the Stripe account.
      return process.env.CASHAPP_PAY_ENABLED === 'true';
    default:
      return false;
  }
}

export const getPartnerStatus = createServerFn({ method: 'GET' }).handler(async (): Promise<PartnerStatus[]> => {
  const ids: PartnerId[] = ['cashapp', 'ccbill', 'segpay', 'epoch'];
  return ids.map((id) => ({ id, enabled: partnerConfigured(id) }));
});

type CheckoutInput = { partner: PartnerId; priceId: string; returnUrl?: string };
type CheckoutResult = { url: string } | { error: string };

export const createPartnerCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CheckoutInput) => {
    if (!/^[a-z0-9_]+$/.test(data.priceId)) throw new Error('Invalid priceId');
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    // Attribution always comes from the verified session, never the client.
    const userId = context.userId;
    const item = CATALOG[data.priceId];
    if (!item) return { error: 'Unknown product' };
    if (!partnerConfigured(data.partner)) return { error: 'This payment option is not live yet' };


    const amount = (item.amountCents / 100).toFixed(2);

    if (data.partner === 'ccbill') {
      const formId = jsonMap(process.env.CCBILL_FLEXFORM_MAP)[data.priceId];
      if (!formId) return { error: 'No CCBill form configured for this product' };
      const params = new URLSearchParams({
        clientAccnum: process.env.CCBILL_ACCOUNT!,
        ...(process.env.CCBILL_SUBACCOUNT ? { clientSubacc: process.env.CCBILL_SUBACCOUNT } : {}),
        formPrice: amount,
        formPeriod: item.kind === 'subscription' ? String(item.intervalDays ?? 7) : '2',
        ...(item.kind === 'subscription'
          ? { formRecurringPrice: amount, formRecurringPeriod: String(item.intervalDays ?? 7), formRebills: '99' }
          : {}),
        currencyCode: '840',
        // Passed straight back on the postback so we can attribute the payment.
        'X-userId': data.userId,
        'X-priceId': data.priceId,
      });
      return { url: `https://api.ccbill.com/wap-frontflex/flexforms/${formId}?${params}` };
    }

    if (data.partner === 'segpay') {
      const eticket = jsonMap(process.env.SEGPAY_PACKAGE_MAP)[data.priceId];
      if (!eticket) return { error: 'No SegPay package configured for this product' };
      const params = new URLSearchParams({
        'x-eticketid': eticket,
        'x-userid': data.userId,
        'x-priceid': data.priceId,
        ...(data.returnUrl ? { 'x-return': data.returnUrl } : {}),
      });
      return { url: `https://secure2.segpay.com/billing/poset.asp?${params}` };
    }

    if (data.partner === 'epoch') {
      const pi = jsonMap(process.env.EPOCH_PI_MAP)[data.priceId];
      if (!pi) return { error: 'No Epoch product configured for this product' };
      const params = new URLSearchParams({
        co: process.env.EPOCH_CO_CODE!,
        pi,
        'x-userid': data.userId,
        'x-priceid': data.priceId,
      });
      return { url: `https://wnu.com/secure/?${params}` };
    }

    return { error: 'This partner runs inside the card checkout' };
  });
