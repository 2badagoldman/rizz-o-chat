CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  host_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_host_id ON public.subscriptions(host_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Hosts view their subscribers" ON public.subscriptions FOR SELECT USING (auth.uid() = host_id);
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.list_memberships ADD COLUMN IF NOT EXISTS chat_access_until timestamptz;

DO $$ BEGIN
  CREATE TYPE public.platform_tier AS ENUM ('free','plus','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform_tier public.platform_tier NOT NULL DEFAULT 'free';

CREATE OR REPLACE FUNCTION public.credit_coins(_user_id uuid, _coins integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id, coin_balance) VALUES (_user_id, _coins)
  ON CONFLICT (user_id) DO UPDATE SET coin_balance = public.wallets.coin_balance + EXCLUDED.coin_balance;
END; $$;

CREATE OR REPLACE FUNCTION public.friends_list_grace_end(_member_id uuid, _host_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.list_memberships lm
     SET status = 'canceled', chat_access_until = now() + interval '30 minutes'
    FROM public.friends_lists fl
   WHERE lm.list_id = fl.id AND lm.member_id = _member_id AND fl.host_id = _host_id AND lm.status = 'active';
END; $$;

CREATE OR REPLACE FUNCTION public.has_chat_access(_member_id uuid, _host_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.list_memberships lm
    JOIN public.friends_lists fl ON fl.id = lm.list_id
    WHERE lm.member_id = _member_id AND fl.host_id = _host_id
      AND (lm.status = 'active' OR (lm.chat_access_until IS NOT NULL AND lm.chat_access_until > now()))
  );
$$;

CREATE OR REPLACE FUNCTION public.grant_friends_list_access(_member_id uuid, _host_id uuid, _price_cents integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_list_id uuid;
BEGIN
  SELECT id INTO v_list_id FROM public.friends_lists WHERE host_id = _host_id LIMIT 1;
  IF v_list_id IS NULL THEN
    INSERT INTO public.friends_lists (host_id, price_cents) VALUES (_host_id, _price_cents) RETURNING id INTO v_list_id;
  END IF;
  INSERT INTO public.list_memberships (list_id, member_id, price_cents_at_join, status, chat_access_until)
  VALUES (v_list_id, _member_id, _price_cents, 'active', NULL)
  ON CONFLICT (list_id, member_id) DO UPDATE SET status = 'active', chat_access_until = NULL, price_cents_at_join = EXCLUDED.price_cents_at_join;
END; $$;