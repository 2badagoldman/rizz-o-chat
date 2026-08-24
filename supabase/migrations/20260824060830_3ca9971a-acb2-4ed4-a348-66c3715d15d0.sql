-- 1. Hide sensitive verification columns on profiles from ordinary authenticated readers.
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id, account_type, display_name, avatar_url, bio, interests, age_confirmed,
  verification_status, flipped_at, created_at, updated_at, gender,
  platform_tier, deleted_at
) ON public.profiles TO authenticated;

GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. SECURITY DEFINER functions should not be callable by signed-out visitors.
REVOKE EXECUTE ON FUNCTION public.creator_code_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.attach_creator_attribution(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.creator_split_pct(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.creator_code_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attach_creator_attribution(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.creator_split_pct(uuid) TO authenticated, service_role;