-- Roll back the definer views (flagged by the linter) in favour of column-level privileges
DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.friends_lists_public;

-- ---------- profiles ----------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Only non-sensitive columns are readable through the Data API.
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, display_name, avatar_url, bio, interests, gender,
  account_type, verification_status, platform_tier,
  created_at, updated_at, deleted_at
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ---------- friends_lists ----------
DROP POLICY IF EXISTS "Admins can read all lists" ON public.friends_lists;
CREATE POLICY "Lists viewable by authenticated"
  ON public.friends_lists FOR SELECT TO authenticated
  USING (true);

REVOKE SELECT ON public.friends_lists FROM authenticated;
REVOKE SELECT ON public.friends_lists FROM anon;
GRANT SELECT (
  id, host_id, title, description, price_cents, active,
  subscriber_count, created_at, updated_at
) ON public.friends_lists TO authenticated;
GRANT ALL ON public.friends_lists TO service_role;