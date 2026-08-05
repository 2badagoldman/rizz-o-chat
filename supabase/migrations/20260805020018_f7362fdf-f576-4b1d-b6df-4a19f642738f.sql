-- Restrict sensitive profile columns from broad authenticated reads.
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  account_type,
  display_name,
  avatar_url,
  bio,
  interests,
  age_confirmed,
  verification_status,
  flipped_at,
  created_at,
  updated_at,
  gender,
  platform_tier,
  deleted_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- webhook_events is service-role only by design; make the deny explicit.
DROP POLICY IF EXISTS "No client access to webhook events" ON public.webhook_events;
CREATE POLICY "No client access to webhook events"
  ON public.webhook_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

GRANT ALL ON public.webhook_events TO service_role;