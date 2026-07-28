CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  )
$$;

REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated, service_role;