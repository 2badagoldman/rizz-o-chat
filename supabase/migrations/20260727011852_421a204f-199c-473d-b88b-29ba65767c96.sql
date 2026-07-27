-- 1) base_subscriptions: read-only for members
DROP POLICY IF EXISTS "Members manage own sub" ON public.base_subscriptions;
CREATE POLICY "Members read own sub" ON public.base_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = member_id);
REVOKE INSERT, UPDATE, DELETE ON public.base_subscriptions FROM authenticated;
GRANT SELECT ON public.base_subscriptions TO authenticated;
GRANT ALL ON public.base_subscriptions TO service_role;

-- 2) list_memberships: hosts read-only (SELECT already covered); no direct host writes
DROP POLICY IF EXISTS "Host manages own list memberships" ON public.list_memberships;
REVOKE INSERT, UPDATE ON public.list_memberships FROM authenticated;
GRANT SELECT, DELETE ON public.list_memberships TO authenticated;
GRANT ALL ON public.list_memberships TO service_role;

-- 3) analytics_events: constrain anon-insertable payloads
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_len CHECK (char_length(event_type) BETWEEN 1 AND 64),
  ADD CONSTRAINT analytics_events_path_len CHECK (path IS NULL OR char_length(path) <= 512),
  ADD CONSTRAINT analytics_events_referrer_len CHECK (referrer IS NULL OR char_length(referrer) <= 512),
  ADD CONSTRAINT analytics_events_device_len CHECK (device IS NULL OR char_length(device) <= 32),
  ADD CONSTRAINT analytics_events_country_len CHECK (country IS NULL OR char_length(country) <= 64),
  ADD CONSTRAINT analytics_events_session_len CHECK (char_length(session_id) BETWEEN 1 AND 64),
  ADD CONSTRAINT analytics_events_duration_range CHECK (duration_ms IS NULL OR duration_ms >= 0) NOT VALID,
  ADD CONSTRAINT analytics_events_metadata_size CHECK (metadata IS NULL OR char_length(metadata::text) <= 2000);