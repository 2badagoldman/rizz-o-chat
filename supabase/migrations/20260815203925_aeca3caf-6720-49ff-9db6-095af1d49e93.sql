-- Tiered creator split: <100 friends = 35%, 100-499 = 50%, 500+ = 65%
CREATE OR REPLACE FUNCTION public.creator_split_pct(_host_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN c >= 500 THEN 65
    WHEN c >= 100 THEN 50
    ELSE 35
  END
  FROM (
    SELECT COUNT(*) AS c
    FROM public.list_memberships lm
    JOIN public.friends_lists fl ON fl.id = lm.list_id
    WHERE fl.host_id = _host_id AND lm.status = 'active'
  ) t;
$$;

GRANT EXECUTE ON FUNCTION public.creator_split_pct(uuid) TO authenticated, service_role;

-- Record a subscription (friends list) earning with the tier split applied at time of payment
CREATE OR REPLACE FUNCTION public.record_list_earning(_host_id uuid, _gross_cents integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_pct int; v_share int;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _host_id IS NULL OR _gross_cents IS NULL OR _gross_cents <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;
  v_pct := public.creator_split_pct(_host_id);
  v_share := FLOOR(_gross_cents * v_pct / 100.0)::int;
  INSERT INTO public.earnings_ledger (host_id, source, gross_cents, host_share_cents, split_pct_at_time)
  VALUES (_host_id, 'list', _gross_cents, v_share, v_pct);
  RETURN jsonb_build_object('ok', true, 'split_pct', v_pct, 'host_share_cents', v_share);
END; $$;

REVOKE ALL ON FUNCTION public.record_list_earning(uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_list_earning(uuid, integer) TO service_role;

-- Gifts now use the same tiered split
CREATE OR REPLACE FUNCTION public.send_coin_gift(_sender uuid, _host uuid, _coins integer, _label text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance integer;
  v_gross_cents integer;
  v_pct integer;
  v_host_share integer;
BEGIN
  IF _sender IS NULL OR _host IS NULL OR _coins IS NULL OR _coins <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;
  IF _sender = _host THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_gift_self');
  END IF;

  UPDATE public.wallets
     SET coin_balance = coin_balance - _coins
   WHERE user_id = _sender AND coin_balance >= _coins
   RETURNING coin_balance INTO v_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins');
  END IF;

  v_gross_cents := _coins;
  v_pct := public.creator_split_pct(_host);
  v_host_share := FLOOR(v_gross_cents * v_pct / 100.0)::int;

  INSERT INTO public.earnings_ledger (host_id, source, gross_cents, host_share_cents, split_pct_at_time)
  VALUES (_host, 'gift', v_gross_cents, v_host_share, v_pct);

  INSERT INTO public.gifts (recipient_host_id, sender_id, coin_value, gift_type)
  VALUES (_host, _sender, _coins, _label);

  RETURN jsonb_build_object('ok', true, 'balance', v_balance, 'split_pct', v_pct);
END; $$;

-- host_self_stats reports the creator's current tier
CREATE OR REPLACE FUNCTION public.host_self_stats(_since timestamp with time zone DEFAULT (now() - '30 days'::interval))
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
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
    'split_pct', public.creator_split_pct(uid),
    'lifetime_host_share_cents', (SELECT COALESCE(SUM(host_share_cents),0) FROM public.earnings_ledger WHERE host_id = uid),
    'pending_payout_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE host_id = uid AND status = 'pending'),
    'paid_payout_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE host_id = uid AND status = 'paid')
  ) INTO result
  FROM public.earnings_ledger
  WHERE host_id = uid AND created_at >= _since;
  RETURN result;
END;
$$;