DROP POLICY IF EXISTS "Anyone can view active showcase" ON public.showcase_media;

CREATE POLICY "Admins can view showcase media"
ON public.showcase_media
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated read active showcase files" ON storage.objects;

CREATE POLICY "Admins read showcase files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));