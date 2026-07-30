/**
 * SegPay postback.
 *
 * Security: SegPay appends a shared secret (configured in the SegPay merchant
 * portal as an extra query parameter) to every postback. We compare it in
 * constant time and reject anything else.
 */
import { createFileRoute } from '@tanstack/react-router';
import {
  alreadyProcessed,
  auditPartner,
  grantPurchase,
  isUuid,
  readPostback,
  revokeSubscription,
  timingSafeEqualStr,
  type PartnerEnv,
} from '@/lib/alt-payments.server';

const PROVIDER = 'segpay';

export const Route = createFileRoute('/api/public/payments/segpay')({
  server: {
    handlers: {
      // SegPay can be configured to GET or POST; accept both.
      GET: handle,
      POST: handle,
    },
  },
});

async function handle({ request }: { request: Request }) {
  const secret = process.env.SEGPAY_POSTBACK_KEY;
  if (!secret) return new Response('Not configured', { status: 503 });

  const p = await readPostback(request);
  const env: PartnerEnv = p.approved === 'test' || p['x-test'] === '1' ? 'sandbox' : 'live';
  const provided = p.key ?? p['x-key'] ?? '';
  if (!timingSafeEqualStr(provided, secret)) {
    await auditPartner(PROVIDER, null, 'bad_signature', env, { action: p.action ?? p.transtype ?? '' });
    return new Response('Invalid key', { status: 401 });
  }

  const action = (p.action ?? p.transtype ?? '').toLowerCase();
  const purchaseId = p.purchaseid ?? p.purchaseId ?? p.transid ?? '';
  const eventId = p.transid ?? p.transID ?? `${purchaseId}_${action}_${p.transdate ?? ''}`;
  if (await alreadyProcessed(PROVIDER, eventId, action || 'unknown')) {
    return new Response('OK', { status: 200 });
  }

  const userId = p['x-userid'] ?? p.userid ?? '';
  const priceId = p['x-priceid'] ?? '';

  try {
    if (['auth', 'initial', 'rebill', 'signup', 'sale'].includes(action)) {
      if (!isUuid(userId)) {
        await auditPartner(PROVIDER, null, 'unattributed', env, { action, purchaseId, userId });
        return new Response('OK', { status: 200 });
      }
      await grantPurchase({
        provider: PROVIDER,
        userId,
        priceId,
        providerRef: purchaseId || eventId,
        env,
        details: { action },
      });
    } else if (action === 'cancel') {
      await revokeSubscription({ provider: PROVIDER, providerRef: purchaseId, env });
    } else if (['expire', 'void', 'credit', 'chargeback', 'refund'].includes(action)) {
      await revokeSubscription({ provider: PROVIDER, providerRef: purchaseId, env, immediate: true });
    } else {
      await auditPartner(PROVIDER, isUuid(userId) ? userId : null, 'ignored', env, { action });
    }
    // SegPay expects a bare "OK" acknowledgement.
    return new Response('OK', { status: 200 });
  } catch (e) {
    await auditPartner(PROVIDER, isUuid(userId) ? userId : null, 'error', env, { action }, String(e));
    return new Response('Handler error', { status: 500 });
  }
}
