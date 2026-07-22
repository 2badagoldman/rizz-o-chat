CREATE OR REPLACE FUNCTION public.admin_platform_metrics(_since timestamp with time zone DEFAULT (now() - '30 days'::interval))
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'gross_cents', COALESCE(SUM(gross_cents), 0),
    'host_share_cents', COALESCE(SUM(host_share_cents), 0),
    'platform_cents', COALESCE(SUM(gross_cents - host_share_cents), 0),
    'transactions', COUNT(*),
    'by_source', (
      SELECT jsonb_object_agg(source, totals) FROM (
        SELECT source::text, jsonb_build_object(
          'gross_cents', SUM(gross_cents),
          'host_share_cents', SUM(host_share_cents),
          'platform_cents', SUM(gross_cents - host_share_cents),
          'count', COUNT(*)
        ) totals
        FROM public.earnings_ledger
        WHERE created_at >= _since
        GROUP BY source
      ) s
    ),
    'active_hosts', (
      SELECT COUNT(*) FROM public.profiles
      WHERE account_type = 'host'
        AND verification_status = 'verified'
        AND deleted_at IS NULL
    ),
    'earning_hosts', (SELECT COUNT(DISTINCT host_id) FROM public.earnings_ledger WHERE created_at >= _since),
    'total_hosts', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'host' AND deleted_at IS NULL),
    'pending_hosts', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'host' AND verification_status = 'pending' AND deleted_at IS NULL),
    'total_members', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'member' AND deleted_at IS NULL),
    'active_subs', (SELECT COUNT(*) FROM public.base_subscriptions WHERE status IN ('active','trialing')),
    'payouts_pending_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE status = 'pending'),
    'payouts_paid_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE status = 'paid')
  )
  INTO result
  FROM public.earnings_ledger
  WHERE created_at >= _since;

  RETURN result;
END;
$function$;