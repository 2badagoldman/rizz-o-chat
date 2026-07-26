-- 1) Attach tamper-prevention triggers (functions existed but were never wired up)
DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

DROP TRIGGER IF EXISTS trg_prevent_friends_list_tamper ON public.friends_lists;
CREATE TRIGGER trg_prevent_friends_list_tamper
  BEFORE UPDATE ON public.friends_lists
  FOR EACH ROW EXECUTE FUNCTION public.prevent_friends_list_tamper();

DROP TRIGGER IF EXISTS trg_kyc_on_submit ON public.kyc_submissions;
CREATE TRIGGER trg_kyc_on_submit
  AFTER INSERT ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.kyc_on_submit();

-- 2) Internal trigger/helper functions must not be callable through the API
REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_friends_list_tamper() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kyc_on_submit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3) Restrict raw profile reads to the owner and admins; expose public fields via a view
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_barrier = true) AS
  SELECT id, display_name, avatar_url, bio, interests, gender,
         account_type, verification_status, created_at
  FROM public.profiles
  WHERE deleted_at IS NULL;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT ALL ON public.profiles_public TO service_role;

-- 4) Restrict raw friends_lists reads to the owning host and admins; public view for discovery
DROP POLICY IF EXISTS "Lists viewable by authenticated" ON public.friends_lists;
CREATE POLICY "Admins can read all lists"
  ON public.friends_lists FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.friends_lists_public
WITH (security_barrier = true) AS
  SELECT id, host_id, title, description, price_cents, active
  FROM public.friends_lists
  WHERE active = true;

GRANT SELECT ON public.friends_lists_public TO authenticated;
GRANT ALL ON public.friends_lists_public TO service_role;

-- 5) Cron: stop authenticating the showcase-brain job with the public anon key
SELECT cron.unschedule('rizzla-showcase-brain');
SELECT cron.schedule(
  'rizzla-showcase-brain',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://project--ff766acd-3197-49c5-9028-9b3a0c8d20eb.lovable.app/api/public/hooks/showcase-brain',
    headers:='{"Content-Type":"application/json","x-cron-secret":"31fdb046a1f46b316f9dc35ff56457da8b9fb7ed9fba0174ffc2765b47b5dfaf"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);