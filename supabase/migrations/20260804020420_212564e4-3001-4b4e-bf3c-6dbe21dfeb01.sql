-- Remove blanket column access, then re-grant only non-sensitive columns
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id, account_type, display_name, avatar_url, bio, interests,
  age_confirmed, verification_status, flipped_at, created_at,
  updated_at, gender, platform_tier, deleted_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;
