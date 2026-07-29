-- 1. Enforce the existing anti-escalation function as a real trigger on profiles
DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Keep the other declared triggers wired too (defensive, idempotent)
DROP TRIGGER IF EXISTS friends_lists_prevent_tamper ON public.friends_lists;
CREATE TRIGGER friends_lists_prevent_tamper
  BEFORE UPDATE ON public.friends_lists
  FOR EACH ROW EXECUTE FUNCTION public.prevent_friends_list_tamper();

-- 2. Anonymous callers must not execute the admin-only SECURITY DEFINER report
REVOKE EXECUTE ON FUNCTION public.install_conversion_metrics(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.install_conversion_metrics(integer) TO authenticated, service_role;

-- 3. Make role escalation impossible from any client role, not just policy-absence
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "No client writes to user_roles" ON public.user_roles;
CREATE POLICY "No client writes to user_roles"
  ON public.user_roles AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);
