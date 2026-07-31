-- 1) Admin-scoped SELECT on guest_subscriptions PII
DROP POLICY IF EXISTS "Admins can view guest subscriptions" ON public.guest_subscriptions;
CREATE POLICY "Admins can view guest subscriptions"
ON public.guest_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Harden has_role: remove the anonymous/unauthenticated probe branch
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.role() = 'service_role'
      OR (auth.uid() IS NOT NULL AND _user_id = auth.uid())
      OR (auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
          ))
    THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END;
$function$;