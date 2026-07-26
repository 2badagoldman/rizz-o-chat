-- 1) Harden has_role: a signed-in user may only resolve their OWN roles.
--    Trusted contexts (service_role, triggers/definer functions where auth.uid()
--    is the acting user) keep full behaviour. All existing RLS policies call
--    has_role(auth.uid(), ...), so they are unaffected.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL
      OR auth.role() = 'service_role'
      OR _user_id = auth.uid()
    THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END;
$$;

-- 2) get_showcase_reel is only ever invoked by trusted server code
--    (service-role client). Signed-in users do not need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.get_showcase_reel(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_showcase_reel(integer) FROM anon;

-- 3) Defensive: ensure anonymous visitors cannot execute the remaining
--    SECURITY DEFINER helpers directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_kyc_state() FROM anon;
REVOKE EXECUTE ON FUNCTION public.host_self_stats(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_host_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.war_room_metrics(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_platform_metrics(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_top_hosts(timestamptz, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_review_kyc(uuid, boolean, text) FROM anon;

-- 4) Preserve required access for the app's own call paths.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_showcase_reel(integer) TO service_role;