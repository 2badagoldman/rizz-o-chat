-- 1) Restrict sensitive profile columns from general authenticated reads
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id, account_type, display_name, avatar_url, bio, interests,
  age_confirmed, verification_status, flipped_at, created_at,
  updated_at, gender, platform_tier, deleted_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- 2) Showcase storage reads must respect the is_active flag
DROP POLICY IF EXISTS "Authenticated read showcase files" ON storage.objects;

CREATE POLICY "Authenticated read active showcase files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'showcase'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.showcase_media m
      WHERE m.storage_path = storage.objects.name
        AND (m.is_active = true OR m.uploader_id = auth.uid())
    )
  )
);