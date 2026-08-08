CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'client',
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  route TEXT,
  url TEXT,
  method TEXT,
  status INTEGER,
  duration_ms INTEGER,
  fingerprint TEXT,
  user_id UUID,
  session_id TEXT,
  user_agent TEXT,
  release TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX error_logs_fingerprint_idx ON public.error_logs (fingerprint, created_at DESC);
CREATE INDEX error_logs_source_idx ON public.error_logs (source, created_at DESC);

GRANT SELECT, DELETE ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read error logs"
  ON public.error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete error logs"
  ON public.error_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));