-- 1. Wallets: remove direct user write access to balances
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
REVOKE UPDATE, INSERT, DELETE ON public.wallets FROM authenticated;
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;

-- 2. Friends lists: keep tier/subscriber_count immutable, validate price bounds
CREATE OR REPLACE FUNCTION public.prevent_friends_list_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
    RAISE EXCEPTION 'Not allowed to change host_id';
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Not allowed to change tier';
  END IF;
  IF NEW.subscriber_count IS DISTINCT FROM OLD.subscriber_count THEN
    RAISE EXCEPTION 'Not allowed to change subscriber_count';
  END IF;
  IF NEW.price_cents IS DISTINCT FROM OLD.price_cents THEN
    IF auth.uid() IS DISTINCT FROM OLD.host_id THEN
      RAISE EXCEPTION 'Not allowed to change price_cents';
    END IF;
    IF NEW.price_cents IS NULL
       OR (NEW.price_cents <> 0 AND (NEW.price_cents < 100 OR NEW.price_cents > 50000)) THEN
      RAISE EXCEPTION 'Price must be free or between $1 and $500';
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS friends_lists_prevent_tamper ON public.friends_lists;
DROP TRIGGER IF EXISTS trg_prevent_friends_list_tamper ON public.friends_lists;
CREATE TRIGGER trg_prevent_friends_list_tamper
BEFORE UPDATE ON public.friends_lists
FOR EACH ROW EXECUTE FUNCTION public.prevent_friends_list_tamper();

-- 3. Profiles: single canonical privilege-escalation guard
DROP TRIGGER IF EXISTS profiles_prevent_escalation ON public.profiles;
DROP TRIGGER IF EXISTS profiles_prevent_priv_escalation ON public.profiles;
DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();