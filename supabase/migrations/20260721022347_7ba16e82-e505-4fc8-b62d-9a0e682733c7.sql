CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,
  email text NOT NULL,
  note text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX early_access_signups_feature_created_idx
  ON public.early_access_signups(feature, created_at DESC);

GRANT INSERT ON public.early_access_signups TO anon, authenticated;
GRANT SELECT ON public.early_access_signups TO authenticated;
GRANT ALL ON public.early_access_signups TO service_role;

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request early access"
  ON public.early_access_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(feature) BETWEEN 1 AND 60
    AND (note IS NULL OR length(note) <= 500)
  );

CREATE POLICY "Admins can view signups"
  ON public.early_access_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));