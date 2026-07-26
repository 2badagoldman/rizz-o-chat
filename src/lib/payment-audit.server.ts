import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let _sb: SupabaseClient<Database> | null = null;
function sb(): SupabaseClient<Database> {
  if (!_sb) {
    _sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

export type PaymentAuditKind = 'catalog' | 'friends_list' | 'tip' | 'portal' | 'subscription' | 'webhook';

export type PaymentAuditEntry = {
  userId?: string | null;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  kind: PaymentAuditKind;
  status: string;
  amountCents?: number | null;
  currency?: string | null;
  environment?: string;
  errorMessage?: string | null;
  details?: Record<string, unknown>;
};

/**
 * Best-effort append to public.payment_audit_log. Never throws: audit logging
 * must not break a checkout or a webhook acknowledgement.
 */
export async function logPaymentEvent(entry: PaymentAuditEntry): Promise<void> {
  try {
    const { error } = await sb().from('payment_audit_log').insert({
      user_id: entry.userId ?? null,
      session_id: entry.sessionId ?? null,
      payment_intent_id: entry.paymentIntentId ?? null,
      kind: entry.kind,
      status: entry.status,
      amount_cents: entry.amountCents ?? null,
      currency: entry.currency ?? null,
      environment: entry.environment ?? 'sandbox',
      error_message: entry.errorMessage ? String(entry.errorMessage).slice(0, 1000) : null,
      details: (entry.details ?? {}) as never,
    });
    if (error) console.error('[payment-audit] insert failed:', error.message);
  } catch (e) {
    console.error('[payment-audit] insert threw:', e);
  }
}
