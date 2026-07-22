
-- 1) Prevent self-elevation on profiles (verification_status, platform_tier, account_type)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_prevent_priv_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_priv_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2) Prevent hosts from self-editing friends_lists.tier / subscriber_count
CREATE OR REPLACE FUNCTION public.prevent_friends_list_tamper()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Not allowed to change tier';
  END IF;
  IF NEW.subscriber_count IS DISTINCT FROM OLD.subscriber_count THEN
    RAISE EXCEPTION 'Not allowed to change subscriber_count';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS friends_lists_prevent_tamper ON public.friends_lists;
CREATE TRIGGER friends_lists_prevent_tamper
BEFORE UPDATE ON public.friends_lists
FOR EACH ROW EXECUTE FUNCTION public.prevent_friends_list_tamper();

-- 3) Remove always-true permissive policies
-- webhook_events: service_role bypasses RLS anyway; drop policy and restrict grants
DROP POLICY IF EXISTS "Service role only" ON public.webhook_events;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;

-- analytics_events: tighten INSERT to require user_id null or matching auth.uid()
DROP POLICY IF EXISTS "anyone can insert events" ON public.analytics_events;
CREATE POLICY "anyone can insert events" ON public.analytics_events
FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 4) Lock down SECURITY DEFINER functions that should not be publicly callable.
-- Revoke EXECUTE from anon/authenticated on internal-only helpers.
REVOKE EXECUTE ON FUNCTION public.credit_coins(uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_friends_list_access(uuid, uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.friends_list_grace_end(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_showcase_event(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_chat_access(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_room_host(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_showcase_reel(integer) FROM anon, PUBLIC;
-- Admin-only aggregations: keep authenticated (checked via has_role inside), revoke anon
REVOKE EXECUTE ON FUNCTION public.admin_platform_metrics(timestamptz) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_top_hosts(timestamptz, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.war_room_metrics(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.host_self_stats(timestamptz) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_host_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_coin_gift(uuid, uuid, integer, text) FROM anon, PUBLIC;
