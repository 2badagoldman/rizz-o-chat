-- 1. PROFILES: hide sensitive columns from other signed-in users
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT TO authenticated
USING (deleted_at IS NULL OR id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, bio, interests, gender, account_type,
              verification_status, platform_tier, flipped_at, created_at, updated_at)
ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- self KYC state must keep working now that kyc columns are not directly selectable
CREATE OR REPLACE FUNCTION public.my_kyc_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); r record;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT kyc_status, kyc_due_at, kyc_approved_at INTO r FROM public.profiles WHERE id = uid;
  RETURN jsonb_build_object(
    'ok', true,
    'status', COALESCE(r.kyc_status::text, 'none'),
    'due_at', r.kyc_due_at,
    'approved_at', r.kyc_approved_at,
    'locked', (COALESCE(r.kyc_status::text,'none') <> 'approved' AND r.kyc_due_at < now())
  );
END; $function$;

-- 2. FRIENDS_LISTS: only active listings are browsable
DROP POLICY IF EXISTS "Lists viewable by authenticated" ON public.friends_lists;
CREATE POLICY "Lists viewable by authenticated"
ON public.friends_lists FOR SELECT TO authenticated
USING (active = true OR host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3. SHOWCASE STORAGE: no anonymous reads of a private bucket
DROP POLICY IF EXISTS "Anon read showcase files" ON storage.objects;