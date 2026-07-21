
-- 1) list_memberships: remove overly permissive member self-manage policy; add host management + member cancel only
DROP POLICY IF EXISTS "Member manages own membership" ON public.list_memberships;

CREATE POLICY "Host manages own list memberships"
  ON public.list_memberships
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.friends_lists fl WHERE fl.id = list_memberships.list_id AND fl.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.friends_lists fl WHERE fl.id = list_memberships.list_id AND fl.host_id = auth.uid()));

CREATE POLICY "Member can cancel own membership"
  ON public.list_memberships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = member_id);

-- 2) earnings_ledger: drop owner INSERT; writes only via service_role (webhook / RPCs)
DROP POLICY IF EXISTS "Ledger inserts by owner" ON public.earnings_ledger;

-- 3) room_members: joining a public room requires an active friends-list membership with that host
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;

CREATE POLICY "Users can join public rooms"
  ON public.room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.host_rooms hr
      JOIN public.friends_lists fl ON fl.host_id = hr.host_id
      JOIN public.list_memberships lm ON lm.list_id = fl.id
      WHERE hr.id = room_members.room_id
        AND hr.is_public = true
        AND lm.member_id = auth.uid()
        AND (
          lm.status = 'active'
          OR (lm.chat_access_until IS NOT NULL AND lm.chat_access_until > now())
        )
    )
  );

-- 4) webhook_events: make service-role-only explicit (no anon/authenticated access)
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
GRANT ALL ON public.webhook_events TO service_role;
CREATE POLICY "Service role only"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5) send_coin_gift: keep SECURITY DEFINER but revoke from authenticated so signed-in users
-- cannot call it directly with a spoofed _sender. Called from server via service_role only.
REVOKE EXECUTE ON FUNCTION public.send_coin_gift(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_coin_gift(uuid, uuid, integer, text) TO service_role;
