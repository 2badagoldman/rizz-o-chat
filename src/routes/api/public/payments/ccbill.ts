/**
 * CCBill background postback.
 *
 * Security: CCBill signs approvals with an MD5 "responseDigest". We recompute
 * it with the account salt and reject anything that doesn't match.
 * Configure this URL for NewSaleSuccess / Renewal / Cancellation / Refund
 * events in the CCBill Webhooks admin.
 */
import { createFileRoute } from '@tanstack/react-router';
import {
  alreadyProcessed,
  auditPartner,
  grantPurchase,
  isUuid,
  md5,
  readPostback,
  revokeSubscription,
  timingSafeEqualStr,
  type PartnerEnv,
} from '@/lib/alt-payments.server';

const PROVIDER = 'ccbill';

function envOf(p: Record<string, string>): PartnerEnv {
  return p.testing === '1' || p.testing === 'true' ? 'sandbox' : 'live';
}

export const Route = createFileRoute('/api/public/payments/ccbill')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const salt = process.env.CCBILL_SALT;
        if (!salt) return new Response('Not configured', { status: 503 });

        const p = await readPostback(request);
        const env = envOf(p);
        const eventType = p.eventType ?? p.event_type ?? 'unknown';
        const subId = p.subscriptionId ?? p.subscription_id ?? '';
        const digest = (p.responseDigest ?? p.dynamicPricingValidationDigest ?? '').toLowerCase();

        // CCBill approval digest: md5(subscriptionId + "1" + salt)
        const expected = md5(`${subId}1${salt}`).toLowerCase();
        if (!digest || !timingSafeEqualStr(digest, expected)) {
          await auditPartner(PROVIDER, null, 'bad_signature', env, { eventType, subId });
          return new Response('Invalid digest', { status: 400 });
        }

        const eventId = p.transactionId || p.transaction_id || `${subId}_${eventType}_${p.timestamp ?? ''}`;
        if (await alreadyProcessed(PROVIDER, eventId, eventType)) {
          return Response.json({ received: true, duplicate: true });
        }

        const userId = p['X-userId'] ?? p['x-userid'] ?? p.customPassThrough ?? '';
        const priceId = p['X-priceId'] ?? p['x-priceid'] ?? '';

        try {
          if (/NewSaleSuccess|Renewal|UpSale/i.test(eventType)) {
            if (!isUuid(userId)) {
              await auditPartner(PROVIDER, null, 'unattributed', env, { eventType, subId, userId });
              return Response.json({ received: true });
            }
            await grantPurchase({
              provider: PROVIDER,
              userId,
              priceId,
              providerRef: subId || eventId,
              env,
              details: { eventType },
            });
          } else if (/Cancellation/i.test(eventType)) {
            await revokeSubscription({ provider: PROVIDER, providerRef: subId, env });
          } else if (/Expiration|Refund|Chargeback|Void/i.test(eventType)) {
            await revokeSubscription({ provider: PROVIDER, providerRef: subId, env, immediate: true });
          } else {
            await auditPartner(PROVIDER, isUuid(userId) ? userId : null, 'ignored', env, { eventType });
          }
          return Response.json({ received: true });
        } catch (e) {
          await auditPartner(PROVIDER, isUuid(userId) ? userId : null, 'error', env, { eventType }, String(e));
          return new Response('Handler error', { status: 500 });
        }
      },
    },
  },
});
