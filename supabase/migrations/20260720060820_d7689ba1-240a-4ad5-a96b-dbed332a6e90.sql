
CREATE TABLE public.showcase_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.showcase_media TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.showcase_media TO authenticated;
GRANT ALL ON public.showcase_media TO service_role;

ALTER TABLE public.showcase_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active showcase" ON public.showcase_media
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage showcase" ON public.showcase_media
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_showcase_updated BEFORE UPDATE ON public.showcase_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies on 'showcase' bucket: admins write, all authenticated read (signed URLs)
CREATE POLICY "Authenticated read showcase files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'showcase');

CREATE POLICY "Admins write showcase files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update showcase files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete showcase files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));
