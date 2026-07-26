-- 1. KYC status enum
DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('none','pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS kyc_due_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS kyc_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- 3. Submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  legal_name text NOT NULL,
  date_of_birth date NOT NULL,
  document_type text NOT NULL DEFAULT 'id_card',
  document_path text NOT NULL,
  selfie_path text,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kyc_submissions_user_idx ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS kyc_submissions_status_idx ON public.kyc_submissions(status);

GRANT SELECT, INSERT ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own kyc select" ON public.kyc_submissions;
CREATE POLICY "own kyc select" ON public.kyc_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "own kyc insert" ON public.kyc_submissions;
CREATE POLICY "own kyc insert" ON public.kyc_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND date_of_birth <= (current_date - interval '18 years')
  );

DROP POLICY IF EXISTS "admin kyc update" ON public.kyc_submissions;
CREATE POLICY "admin kyc update" ON public.kyc_submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS kyc_submissions_updated_at ON public.kyc_submissions;
CREATE TRIGGER kyc_submissions_updated_at BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. When a submission is created, mark profile pending
CREATE OR REPLACE FUNCTION public.kyc_on_submit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles SET kyc_status = 'pending' WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS kyc_submissions_after_insert ON public.kyc_submissions;
CREATE TRIGGER kyc_submissions_after_insert AFTER INSERT ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.kyc_on_submit();

-- 5. Block self-editing of kyc fields
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Not allowed to change verification_status';
  END IF;
  IF NEW.platform_tier IS DISTINCT FROM OLD.platform_tier THEN
    RAISE EXCEPTION 'Not allowed to change platform_tier';
  END IF;
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    RAISE EXCEPTION 'Not allowed to change account_type';
  END IF;
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
    RAISE EXCEPTION 'Not allowed to change kyc_status';
  END IF;
  IF NEW.kyc_due_at IS DISTINCT FROM OLD.kyc_due_at THEN
    RAISE EXCEPTION 'Not allowed to change kyc_due_at';
  END IF;
  IF NEW.kyc_approved_at IS DISTINCT FROM OLD.kyc_approved_at THEN
    RAISE EXCEPTION 'Not allowed to change kyc_approved_at';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_escalation BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 6. Admin review RPC
CREATE OR REPLACE FUNCTION public.admin_review_kyc(_submission_id uuid, _approve boolean, _notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.kyc_submissions
     SET status = CASE WHEN _approve THEN 'approved'::public.kyc_status ELSE 'rejected'::public.kyc_status END,
         review_notes = _notes,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _submission_id
   RETURNING user_id INTO v_user;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF _approve THEN
    UPDATE public.profiles
       SET kyc_status = 'approved', kyc_approved_at = now()
     WHERE id = v_user;
  ELSE
    UPDATE public.profiles
       SET kyc_status = 'rejected'
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', v_user);
END; $$;

REVOKE ALL ON FUNCTION public.admin_review_kyc(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_kyc(uuid, boolean, text) TO authenticated;

-- 7. Helper: current user's KYC state
CREATE OR REPLACE FUNCTION public.my_kyc_state()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); r record;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT kyc_status, kyc_due_at, kyc_approved_at INTO r FROM public.profiles WHERE id = uid;
  RETURN jsonb_build_object(
    'ok', true,
    'status', COALESCE(r.kyc_status::text, 'none'),
    'due_at', r.kyc_due_at,
    'approved_at', r.kyc_approved_at,
    'locked', (COALESCE(r.kyc_status::text,'none') <> 'approved' AND r.kyc_due_at < now())
  );
END; $$;

REVOKE ALL ON FUNCTION public.my_kyc_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_kyc_state() TO authenticated;

-- 8. Existing users get a fresh 7-day window
UPDATE public.profiles SET kyc_due_at = now() + interval '7 days' WHERE kyc_status = 'none';