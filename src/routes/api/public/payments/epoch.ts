/**
 * Epoch postback (Data Post / Global Post).
 *
 * Security: Epoch signs each post with an MD5 hash of a subset of fields plus
 * the merchant's validation key. We recompute it and reject mismatches.
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

const PROVIDER = 'epoch';

export const Route = createFileRoute('/api/public/payments/epoch')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

async function handle({ request }: { request: Request }) {
  const key = process.env.EPOCH_VALIDATION_KEY;
  if (!key) return new Response('Not configured', { status: 503 });

  const p = await readPostback(request);
  const env: PartnerEnv = p.test === '1' || p.transaction_type === 'test' ? 'sandbox' : 'live';

  const memberId = p.member_id ?? p.memberid ?? '';
  const transId = p.transaction_id ?? p.transactionid ?? p.trans_id ?? '';
  const amount = p.amount ?? '';
  const provided = (p.epoch_digest ?? p.digest ?? p.md5 ?? '').toLowerCase();
  // Epoch digest: md5(transaction_id + member_id + amount + validation key)
  const expected = md5(`${transId}${memberId}${amount}${key}`).toLowerCase();
  if (!provided || !timingSafeEqualStr(provided, expected)) {
    await auditPartner(PROVIDER, null, 'bad_signature', env, { transId, memberId });
    return new Response('Invalid digest', { status: 401 });
  }

  const type = (p.transaction_type ?? p.type ?? p.event ?? '').toLowerCase();
  if (await alreadyProcessed(PROVIDER, transId || `${memberId}_${type}`, type || 'unknown')) {
    return new Response('OK', { status: 200 });
  }

  const userId = p['x-userid'] ?? p.userid ?? '';
  const priceId = p['x-priceid'] ?? '';

  try {
    if (['join', 'rebill', 'sale', 'upgrade', 'conversion'].includes(type)) {
      if (!isUuid(userId)) {
        await auditPartner(PROVIDER, null, 'unattributed', env, { type, transId, userId });
        return new Response('OK', { status: 200 });
      }
      await grantPurchase({
        provider: PROVIDER,
        userId,
        priceId,
        providerRef: memberId || transId,
        env,
        details: { type },
      });
    } else if (type === 'cancel') {
      await revokeSubscription({ provider: PROVIDER, providerRef: memberId || transId, env });
    } else if (['expire', 'chargeback', 'refund', 'credit', 'void'].includes(type)) {
      await revokeSubscription({ provider: PROVIDER, providerRef: memberId || transId, env, immediate: true });
    } else {
      await auditPartner(PROVIDER, isUuid(userId) ? userId : null, 'ignored', env, { type });
    }
    return new Response('OK', { status: 200 });
  } catch (e) {
    await auditPartner(PROVIDER, isUuid(userId) ? userId : null, 'error', env, { type }, String(e));
    return new Response('Handler error', { status: 500 });
  }
}
