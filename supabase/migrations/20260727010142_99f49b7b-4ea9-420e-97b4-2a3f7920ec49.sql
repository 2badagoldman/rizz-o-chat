CREATE TABLE public.host_chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  host_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, host_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_chat_threads TO authenticated;
GRANT ALL ON public.host_chat_threads TO service_role;

ALTER TABLE public.host_chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_host_chat_threads_select" ON public.host_chat_threads
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_host_chat_threads_insert" ON public.host_chat_threads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_host_chat_threads_update" ON public.host_chat_threads
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_host_chat_threads_delete" ON public.host_chat_threads
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_host_chat_threads_updated_at
  BEFORE UPDATE ON public.host_chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX host_chat_threads_user_idx ON public.host_chat_threads (user_id, updated_at DESC);