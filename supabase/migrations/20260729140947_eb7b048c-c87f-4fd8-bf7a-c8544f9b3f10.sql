CREATE TABLE public.guest_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  email text,
  price_id text NOT NULL,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  environment text NOT NULL DEFAULT 'sandbox',
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_subscriptions_code ON public.guest_subscriptions(code);
CREATE INDEX idx_guest_subscriptions_session ON public.guest_subscriptions(stripe_checkout_session_id);

GRANT ALL ON public.guest_subscriptions TO service_role;

ALTER TABLE public.guest_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimers can view their claimed guest subscriptions"
  ON public.guest_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = claimed_by);

CREATE TRIGGER update_guest_subscriptions_updated_at
  BEFORE UPDATE ON public.guest_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();