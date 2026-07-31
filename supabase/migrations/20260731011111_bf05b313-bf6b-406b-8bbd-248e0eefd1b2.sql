ALTER TABLE public.guest_subscriptions ADD COLUMN IF NOT EXISTS phone text;
CREATE INDEX IF NOT EXISTS guest_subscriptions_phone_idx ON public.guest_subscriptions (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS guest_subscriptions_email_idx ON public.guest_subscriptions (email) WHERE email IS NOT NULL;