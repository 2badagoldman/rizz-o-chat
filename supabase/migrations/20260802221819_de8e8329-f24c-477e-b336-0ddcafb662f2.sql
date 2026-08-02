CREATE TABLE IF NOT EXISTS public.profile_demographics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ethnicity text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profile_demographics TO authenticated;
GRANT ALL ON public.profile_demographics TO service_role;

ALTER TABLE public.profile_demographics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own demographics select" ON public.profile_demographics;
CREATE POLICY "own demographics select" ON public.profile_demographics
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "own demographics insert" ON public.profile_demographics;
CREATE POLICY "own demographics insert" ON public.profile_demographics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own demographics update" ON public.profile_demographics;
CREATE POLICY "own demographics update" ON public.profile_demographics
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());