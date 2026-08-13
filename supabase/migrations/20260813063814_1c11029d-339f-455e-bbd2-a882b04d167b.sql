CREATE TABLE public.creator_attributions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creator_attributions_code ON public.creator_attributions (code);
CREATE INDEX idx_creator_attributions_host ON public.creator_attributions (host_id);

GRANT SELECT ON public.creator_attributions TO authenticated;
GRANT ALL ON public.creator_attributions TO service_role;

ALTER TABLE public.creator_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own attribution readable" ON public.creator_attributions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.creator_code_stats(_host_id uuid DEFAULT NULL)
RETURNS TABLE(
  code text,
  label text,
  host_id uuid,
  display_name text,
  active boolean,
  created_at timestamptz,
  visits bigint,
  installs bigint,
  signups bigint,
  subscribers bigint,
  friends bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin boolean := (auth.role() = 'service_role') OR public.has_role(auth.uid(), 'admin');
BEGIN
  IF NOT v_admin THEN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
    _host_id := auth.uid();
  END IF;

  RETURN QUERY
  SELECT
    i.code,
    i.label,
    i.host_id,
    p.display_name,
    i.active,
    i.created_at,
    (SELECT COUNT(DISTINCT e.session_id) FROM public.analytics_events e
       WHERE e.event_type = 'ref_visit' AND e.metadata->>'code' = i.code)::bigint,
    (SELECT COUNT(DISTINCT e.session_id) FROM public.analytics_events e
       WHERE e.event_type = 'app_install' AND e.metadata->>'ref' = i.code)::bigint,
    (SELECT COUNT(*) FROM public.creator_attributions a WHERE a.code = i.code)::bigint,
    (SELECT COUNT(DISTINCT s.user_id) FROM public.creator_attributions a
       JOIN public.subscriptions s ON s.user_id = a.user_id
       WHERE a.code = i.code AND s.status IN ('active','trialing','past_due'))::bigint,
    (SELECT COUNT(*) FROM public.creator_attributions a
       JOIN public.list_memberships lm ON lm.member_id = a.user_id
       JOIN public.friends_lists fl ON fl.id = lm.list_id AND fl.host_id = i.host_id
       WHERE a.code = i.code AND lm.status = 'active')::bigint
  FROM public.host_invites i
  LEFT JOIN public.profiles p ON p.id = i.host_id
  WHERE (_host_id IS NULL OR i.host_id = _host_id)
  ORDER BY i.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_creator_attribution(_code text, _source text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_host uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthorized'); END IF;
  _code := upper(trim(coalesce(_code, '')));
  IF _code = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT h.host_id INTO v_host FROM public.host_invites h WHERE h.code = _code LIMIT 1;
  IF v_host IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF v_host = v_uid THEN RETURN jsonb_build_object('ok', false, 'error', 'self'); END IF;

  INSERT INTO public.creator_attributions (user_id, code, host_id, source)
  VALUES (v_uid, _code, v_host, _source)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.referrals (referrer_host_id, referred_user_id, referred_role)
  VALUES (v_host, v_uid, 'member')
  ON CONFLICT (referred_user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'host_id', v_host);
END;
$$;