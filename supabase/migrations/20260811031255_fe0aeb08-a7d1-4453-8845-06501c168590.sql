REVOKE INSERT, UPDATE, DELETE ON public.guest_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.guest_subscriptions TO authenticated;
GRANT ALL ON public.guest_subscriptions TO service_role;