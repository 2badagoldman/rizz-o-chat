CREATE TABLE public.host_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  city text,
  social_handle text,
  pitch text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX host_applications_pending_unique
  ON public.host_applications (user_id)
  WHERE status = 'pending';

GRANT SELECT, INSERT ON public.host_applications TO authenticated;
GRANT ALL ON public.host_applications TO service_role;

ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own application"
  ON public.host_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit their own application"
  ON public.host_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can review applications"
  ON public.host_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_host_applications_updated_at
  BEFORE UPDATE ON public.host_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_review_host_application(_application_id uuid, _approve boolean, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user uuid;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.host_applications
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         review_notes = _notes,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _application_id
   RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF _approve THEN
    UPDATE public.profiles
       SET account_type = 'host', verification_status = 'verified'
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', v_user);
END; $$;

REVOKE ALL ON FUNCTION public.admin_review_host_application(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_host_application(uuid, boolean, text) TO authenticated, service_role;