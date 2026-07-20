-- Host payouts tracking
CREATE TABLE public.host_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  status text NOT NULL DEFAULT 'pending', -- pending|paid|failed
  method text NOT NULL DEFAULT 'stripe_connect',
  reference text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.host_payouts TO authenticated;
GRANT ALL ON public.host_payouts TO service_role;
ALTER TABLE public.host_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts view own payouts" ON public.host_payouts
  FOR SELECT TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Admins view all payouts" ON public.host_payouts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage payouts" ON public.host_payouts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_host_payouts_updated_at BEFORE UPDATE ON public.host_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin-only aggregate metrics function (bypasses RLS but role-checked)
CREATE OR REPLACE FUNCTION public.admin_platform_metrics(_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    'active_hosts', (SELECT COUNT(DISTINCT host_id) FROM public.earnings_ledger WHERE created_at >= _since),
    'total_hosts', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'host'),
    'total_members', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'member'),
    'active_subs', (SELECT COUNT(*) FROM public.base_subscriptions WHERE status IN ('active','trialing')),
    'payouts_pending_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE status = 'pending'),
    'payouts_paid_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE status = 'paid')
  )
  INTO result
  FROM public.earnings_ledger
  WHERE created_at >= _since;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_hosts(_since timestamptz DEFAULT (now() - interval '30 days'), _limit int DEFAULT 20)
RETURNS TABLE(host_id uuid, display_name text, gross_cents bigint, host_share_cents bigint, platform_cents bigint, transactions bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT e.host_id,
           p.display_name,
           SUM(e.gross_cents)::bigint,
           SUM(e.host_share_cents)::bigint,
           SUM(e.gross_cents - e.host_share_cents)::bigint,
           COUNT(*)::bigint
    FROM public.earnings_ledger e
    LEFT JOIN public.profiles p ON p.id = e.host_id
    WHERE e.created_at >= _since
    GROUP BY e.host_id, p.display_name
    ORDER BY SUM(e.gross_cents) DESC
    LIMIT _limit;
END;
$$;

-- Host self-stats (any authenticated host can call for themselves)
CREATE OR REPLACE FUNCTION public.host_self_stats(_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT jsonb_build_object(
    'host_share_cents', COALESCE(SUM(host_share_cents), 0),
    'gross_cents', COALESCE(SUM(gross_cents), 0),
    'transactions', COUNT(*),
    'active_friends', (SELECT COUNT(*) FROM public.list_memberships lm
                       JOIN public.friends_lists fl ON fl.id = lm.list_id
                       WHERE fl.host_id = uid AND lm.status = 'active'),
    'lifetime_host_share_cents', (SELECT COALESCE(SUM(host_share_cents),0) FROM public.earnings_ledger WHERE host_id = uid),
    'pending_payout_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE host_id = uid AND status = 'pending'),
    'paid_payout_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE host_id = uid AND status = 'paid')
  ) INTO result
  FROM public.earnings_ledger
  WHERE host_id = uid AND created_at >= _since;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_platform_metrics(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_hosts(timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.host_self_stats(timestamptz) TO authenticated;