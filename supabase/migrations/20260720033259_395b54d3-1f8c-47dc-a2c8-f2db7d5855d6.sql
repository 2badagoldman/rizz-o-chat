
-- ============ ENUMS ============
CREATE TYPE public.account_type AS ENUM ('host','member');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.list_tier AS ENUM ('new','rising','popular','elite');
CREATE TYPE public.membership_status AS ENUM ('trial','active','cancelled');
CREATE TYPE public.plan_type AS ENUM ('weekly','monthly');
CREATE TYPE public.sub_status AS ENUM ('trial','active','cancelled','expired');
CREATE TYPE public.earning_source AS ENUM ('list','gift','referral');
CREATE TYPE public.app_role AS ENUM ('admin');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type public.account_type NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  age_confirmed BOOLEAN NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  flipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ USER ROLES (admin only, separate table) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ WALLETS (stubbed coins) ============
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_balance INTEGER NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ FRIENDS LISTS ============
CREATE TABLE public.friends_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 499,
  tier public.list_tier NOT NULL DEFAULT 'new',
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.friends_lists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friends_lists TO authenticated;
GRANT ALL ON public.friends_lists TO service_role;
ALTER TABLE public.friends_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lists viewable by everyone" ON public.friends_lists FOR SELECT USING (true);
CREATE POLICY "Hosts manage own list" ON public.friends_lists FOR ALL TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- ============ LIST MEMBERSHIPS ============
CREATE TABLE public.list_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.friends_lists(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.membership_status NOT NULL DEFAULT 'trial',
  price_cents_at_join INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  renews_at TIMESTAMPTZ,
  UNIQUE (list_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.list_memberships TO authenticated;
GRANT ALL ON public.list_memberships TO service_role;
ALTER TABLE public.list_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Member sees own memberships" ON public.list_memberships FOR SELECT TO authenticated
  USING (auth.uid() = member_id OR auth.uid() IN (SELECT host_id FROM public.friends_lists WHERE id = list_id));
CREATE POLICY "Member manages own membership" ON public.list_memberships FOR ALL TO authenticated
  USING (auth.uid() = member_id) WITH CHECK (auth.uid() = member_id);

-- ============ BASE SUBSCRIPTIONS ============
CREATE TABLE public.base_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.plan_type NOT NULL DEFAULT 'weekly',
  status public.sub_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  renews_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.base_subscriptions TO authenticated;
GRANT ALL ON public.base_subscriptions TO service_role;
ALTER TABLE public.base_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own sub" ON public.base_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = member_id) WITH CHECK (auth.uid() = member_id);

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.friends_lists(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Message visibility" ON public.messages FOR SELECT TO authenticated USING (
  auth.uid() = sender_id
  OR auth.uid() = recipient_id
  OR (list_id IS NOT NULL AND auth.uid() IN (SELECT host_id FROM public.friends_lists WHERE id = list_id))
  OR (list_id IS NOT NULL AND auth.uid() IN (SELECT member_id FROM public.list_memberships WHERE list_id = messages.list_id AND status IN ('trial','active')))
);
CREATE POLICY "Send own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- ============ GIFTS ============
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  coin_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gift visibility" ON public.gifts FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, recipient_host_id));
CREATE POLICY "Send own gifts" ON public.gifts FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- ============ EARNINGS LEDGER ============
CREATE TABLE public.earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source public.earning_source NOT NULL,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  host_share_cents INTEGER NOT NULL DEFAULT 0,
  split_pct_at_time INTEGER NOT NULL DEFAULT 35,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.earnings_ledger TO authenticated;
GRANT ALL ON public.earnings_ledger TO service_role;
ALTER TABLE public.earnings_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Host sees own ledger" ON public.earnings_ledger FOR SELECT TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Ledger inserts by owner" ON public.earnings_ledger FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

-- ============ REFERRALS ============
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_role public.account_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrer sees own" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_host_id);
CREATE POLICY "Referred user or referrer inserts" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referred_user_id OR auth.uid() = referrer_host_id);

-- ============ PROMO SLIDES ============
CREATE TABLE public.promo_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  headline TEXT NOT NULL,
  subtext TEXT,
  cta_text TEXT,
  cta_link TEXT,
  partner_name TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  usage_rights_confirmed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_slides TO anon, authenticated;
GRANT ALL ON public.promo_slides TO service_role;
ALTER TABLE public.promo_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active slides readable" ON public.promo_slides FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage slides" ON public.promo_slides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGER: auto-create profile + wallet on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account_type public.account_type;
  v_display TEXT;
  v_age_confirmed BOOLEAN;
BEGIN
  v_account_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type',''), 'member')::public.account_type;
  v_display := COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''), split_part(NEW.email, '@', 1));
  v_age_confirmed := COALESCE((NEW.raw_user_meta_data->>'age_confirmed')::boolean, false);

  INSERT INTO public.profiles (id, account_type, display_name, age_confirmed)
  VALUES (NEW.id, v_account_type, v_display, v_age_confirmed);

  INSERT INTO public.wallets (user_id, coin_balance) VALUES (NEW.id, 500);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
