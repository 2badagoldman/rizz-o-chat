CREATE TABLE public.payment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  payment_intent_id text,
  kind text NOT NULL,
  status text NOT NULL,
  amount_cents integer,
  currency text,
  environment text NOT NULL DEFAULT 'sandbox',
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_audit_user ON public.payment_audit_log(user_id, created_at DESC);
CREATE INDEX idx_payment_audit_session ON public.payment_audit_log(session_id);
CREATE INDEX idx_payment_audit_status ON public.payment_audit_log(status, created_at DESC);

GRANT SELECT ON public.payment_audit_log TO authenticated;
GRANT ALL ON public.payment_audit_log TO service_role;

ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payment audit rows"
  ON public.payment_audit_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all payment audit rows"
  ON public.payment_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_audit_updated_at
  BEFORE UPDATE ON public.payment_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();