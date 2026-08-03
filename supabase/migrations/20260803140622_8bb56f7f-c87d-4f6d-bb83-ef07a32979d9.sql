CREATE TABLE public.ops_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  summary text,
  items integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  trigger text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ops_runs TO authenticated;
GRANT ALL ON public.ops_runs TO service_role;

ALTER TABLE public.ops_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ops runs"
  ON public.ops_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ops_runs_manager_created_idx ON public.ops_runs (manager, created_at DESC);