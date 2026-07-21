
CREATE TABLE public.host_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  label text,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX host_invites_host_id_idx ON public.host_invites(host_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_invites TO authenticated;
GRANT ALL ON public.host_invites TO service_role;
ALTER TABLE public.host_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage own invites" ON public.host_invites
  FOR ALL TO authenticated
  USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- Anyone authenticated can look up an invite by code (needed for redemption preview)
CREATE POLICY "Anyone can view active invites" ON public.host_invites
  FOR SELECT TO authenticated
  USING (active = true);

-- Redemption RPC: comps caller into inviter's friends list, records referral, increments uses
CREATE OR REPLACE FUNCTION public.redeem_host_invite(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invite public.host_invites;
  v_list_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO v_invite FROM public.host_invites
   WHERE code = _code AND active = true
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;
  IF v_invite.max_uses IS NOT NULL AND v_invite.uses >= v_invite.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'max_uses_reached');
  END IF;
  IF v_invite.host_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_invite_self');
  END IF;

  -- Ensure host has a friends list
  SELECT id INTO v_list_id FROM public.friends_lists WHERE host_id = v_invite.host_id LIMIT 1;
  IF v_list_id IS NULL THEN
    INSERT INTO public.friends_lists (host_id, title, price_cents)
    VALUES (v_invite.host_id, 'Friends List', 0)
    RETURNING id INTO v_list_id;
  END IF;

  -- Comp the member (free join)
  INSERT INTO public.list_memberships (list_id, member_id, price_cents_at_join, status, chat_access_until)
  VALUES (v_list_id, v_uid, 0, 'active', NULL)
  ON CONFLICT (list_id, member_id) DO UPDATE
    SET status = 'active', chat_access_until = NULL, price_cents_at_join = 0;

  -- Record referral (one referrer per user via unique constraint)
  INSERT INTO public.referrals (referrer_host_id, referred_user_id, referred_role)
  VALUES (v_invite.host_id, v_uid, 'member')
  ON CONFLICT (referred_user_id) DO NOTHING;

  UPDATE public.host_invites SET uses = uses + 1 WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'host_id', v_invite.host_id);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_host_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_host_invite(text) TO authenticated;
