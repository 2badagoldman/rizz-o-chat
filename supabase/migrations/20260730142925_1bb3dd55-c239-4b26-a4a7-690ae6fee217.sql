-- 1) Stop broadcasting early access signups over realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.early_access_signups;

-- 2) Hide uploader_id from public/authenticated readers of showcase_media
REVOKE SELECT ON public.showcase_media FROM anon, authenticated;
GRANT SELECT (id, storage_path, media_type, caption, sort_order, is_active, created_at, updated_at, impressions, dismisses, completes, ai_score, ai_caption_updated_at, original_caption)
  ON public.showcase_media TO anon, authenticated;
GRANT ALL ON public.showcase_media TO service_role;

-- 3) has_role: allow admins to check other users' roles, keep fail-closed otherwise
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL
      OR auth.role() = 'service_role'
      OR _user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END;
$$;

-- 4) Profiles: ensure the column-restriction trigger is present exactly once
DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();