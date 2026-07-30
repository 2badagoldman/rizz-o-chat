ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe';
CREATE INDEX IF NOT EXISTS subscriptions_provider_idx ON public.subscriptions (provider);