import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type PaymentAuditRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  payment_intent_id: string | null;
  kind: string;
  status: string;
  amount_cents: number | null;
  currency: string | null;
  environment: string;
  error_message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Reads the payment audit log. RLS scopes results automatically:
 * members see only their own rows, admins see everything.
 */
export const listPaymentAudit = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string; status?: string; limit?: number }) => data ?? {})
  .handler(async ({ data, context }): Promise<{ rows: PaymentAuditRow[]; error?: string }> => {
    const limit = Math.min(Math.max(data.limit ?? 100, 1), 500);
    let query = context.supabase
      .from('payment_audit_log')
      .select('id,user_id,session_id,payment_intent_id,kind,status,amount_cents,currency,environment,error_message,details,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data.status && data.status !== 'all') {
      if (data.status === 'errors') query = query.not('error_message', 'is', null);
      else query = query.eq('status', data.status);
    }
    const search = data.search?.trim();
    if (search) {
      query = query.or(`session_id.ilike.%${search}%,payment_intent_id.ilike.%${search}%,user_id.eq.${/^[0-9a-f-]{36}$/.test(search) ? search : '00000000-0000-0000-0000-000000000000'}`);
    }

    const { data: rows, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (rows ?? []) as PaymentAuditRow[] };
  });
