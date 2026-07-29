-- Chat media storage policies (private bucket, per-user folder)
CREATE POLICY "chat media own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat media own select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat media own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Read receipts / unread tracking per conversation
CREATE TABLE public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  peer_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, peer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reads TO authenticated;
GRANT ALL ON public.message_reads TO service_role;

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own message reads" ON public.message_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_message_reads_updated_at
  BEFORE UPDATE ON public.message_reads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();