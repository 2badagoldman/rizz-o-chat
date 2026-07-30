CREATE TABLE public.member_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  member_id uuid NOT NULL,
  media_blocked boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (host_id, member_id),
  CHECK (host_id <> member_id),
  CHECK (reason IS NULL OR length(reason) <= 500)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_restrictions TO authenticated;
GRANT ALL ON public.member_restrictions TO service_role;

ALTER TABLE public.member_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage their own restrictions"
  ON public.member_restrictions FOR ALL TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Members can see restrictions placed on them"
  ON public.member_restrictions FOR SELECT TO authenticated
  USING (auth.uid() = member_id);

CREATE POLICY "Admins can review restrictions"
  ON public.member_restrictions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER member_restrictions_updated_at
  BEFORE UPDATE ON public.member_restrictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_member_restrictions_member ON public.member_restrictions (member_id);