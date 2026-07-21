
-- 1. Webhook idempotency table
CREATE TABLE public.webhook_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- no policies: service_role bypasses RLS; no user access needed.

-- 2. Atomic coin gift RPC: debit sender, credit host earnings, log gift.
CREATE OR REPLACE FUNCTION public.send_coin_gift(
  _sender uuid,
  _host uuid,
  _coins integer,
  _label text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_gross_cents integer;
  v_host_share integer;
BEGIN
  IF _sender IS NULL OR _host IS NULL OR _coins IS NULL OR _coins <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;
  IF _sender = _host THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_gift_self');
  END IF;

  -- Atomic decrement with balance check
  UPDATE public.wallets
     SET coin_balance = coin_balance - _coins
   WHERE user_id = _sender AND coin_balance >= _coins
   RETURNING coin_balance INTO v_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins');
  END IF;

  -- 1 coin = 1 cent gross value for earnings math (mirrors existing tip scale)
  v_gross_cents := _coins;
  v_host_share := FLOOR(v_gross_cents * 0.65)::int;

  INSERT INTO public.earnings_ledger (host_id, source, gross_cents, host_share_cents, split_pct_at_time)
  VALUES (_host, 'gift', v_gross_cents, v_host_share, 65);

  INSERT INTO public.gifts (recipient_host_id, sender_id, coin_value, gift_type)
  VALUES (_host, _sender, _coins, _label);

  RETURN jsonb_build_object('ok', true, 'balance', v_balance);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.send_coin_gift(uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_coin_gift(uuid, uuid, integer, text) TO authenticated;
