-- Security fix: paid profile media must require a live billing subscription.
-- Previously has_chat_access() treated list_memberships.status = 'active' as
-- sufficient forever, so a member whose payment lapsed kept access to paid
-- creator media. Now: grace windows and free/comped memberships still work;
-- paid memberships require a live subscriptions row for that host.
CREATE OR REPLACE FUNCTION public.has_chat_access(_member_id uuid, _host_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.list_memberships lm
    JOIN public.friends_lists fl ON fl.id = lm.list_id
    WHERE lm.member_id = _member_id AND fl.host_id = _host_id
      AND (
        -- Time-bounded grace window set by billing webhooks on cancellation.
        (lm.chat_access_until IS NOT NULL AND lm.chat_access_until > now())
        -- Free/comped memberships granted by the host need no billing row.
        OR (lm.status = 'active' AND lm.price_cents_at_join <= 0)
        -- Paid memberships require a currently-valid subscription.
        OR (lm.status = 'active' AND EXISTS (
          SELECT 1 FROM public.subscriptions s
          WHERE s.user_id = lm.member_id
            AND s.host_id = _host_id
            AND s.status IN ('active', 'trialing', 'past_due')
            AND (s.current_period_end IS NULL OR s.current_period_end > now())
        ))
      )
  );
$$;

-- Security fix: members must be able to delete their own sensitive
-- demographics (ethnicity) row. SELECT/INSERT/UPDATE existed; DELETE did not.
CREATE POLICY "own demographics delete"
ON public.profile_demographics
FOR DELETE
TO authenticated
USING (user_id = auth.uid());