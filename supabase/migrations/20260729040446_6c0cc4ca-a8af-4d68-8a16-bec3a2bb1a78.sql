CREATE OR REPLACE FUNCTION public.install_conversion_metrics(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz := now() - make_interval(days => GREATEST(1, LEAST(365, _days)));
  v_visitors int;
  v_prompts int;
  v_installs int;
  v_standalone int;
  v_signups int;
  v_subs int;
  v_active int;
  result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COUNT(DISTINCT session_id) INTO v_visitors
    FROM public.analytics_events WHERE created_at >= v_since;

  SELECT COUNT(DISTINCT session_id) INTO v_prompts
    FROM public.analytics_events WHERE created_at >= v_since AND event_type = 'install_prompt';

  SELECT COUNT(DISTINCT session_id) INTO v_installs
    FROM public.analytics_events WHERE created_at >= v_since AND event_type = 'app_install';

  SELECT COUNT(DISTINCT session_id) INTO v_standalone
    FROM public.analytics_events WHERE created_at >= v_since AND event_type = 'app_open_standalone';

  SELECT COUNT(*) INTO v_signups
    FROM public.profiles WHERE created_at >= v_since AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_subs
    FROM public.subscriptions WHERE created_at >= v_since;

  SELECT COUNT(*) INTO v_active
    FROM public.subscriptions WHERE status IN ('active','trialing','past_due');

  SELECT jsonb_build_object(
    'days', GREATEST(1, LEAST(365, _days)),
    'visitors', COALESCE(v_visitors,0),
    'install_prompts', COALESCE(v_prompts,0),
    'installs', COALESCE(v_installs,0),
    'standalone_sessions', COALESCE(v_standalone,0),
    'signups', COALESCE(v_signups,0),
    'subscriptions', COALESCE(v_subs,0),
    'active_subs', COALESCE(v_active,0),
    'install_rate', CASE WHEN COALESCE(v_visitors,0) = 0 THEN 0 ELSE ROUND((v_installs::numeric / v_visitors) * 100, 1) END,
    'signup_rate', CASE WHEN COALESCE(v_visitors,0) = 0 THEN 0 ELSE ROUND((v_signups::numeric / v_visitors) * 100, 1) END,
    'subscribe_rate', CASE WHEN COALESCE(v_signups,0) = 0 THEN 0 ELSE ROUND((v_subs::numeric / v_signups) * 100, 1) END,
    'install_to_subscribe_rate', CASE WHEN COALESCE(v_installs,0) = 0 THEN 0 ELSE ROUND((v_subs::numeric / v_installs) * 100, 1) END,
    'by_platform', (
      SELECT COALESCE(jsonb_object_agg(p, ct), '{}'::jsonb) FROM (
        SELECT COALESCE(metadata->>'platform', 'web') AS p, COUNT(DISTINCT session_id) AS ct
        FROM public.analytics_events
        WHERE created_at >= v_since AND event_type = 'app_install'
        GROUP BY 1
      ) x
    ),
    'timeseries', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.bucket), '[]'::jsonb) FROM (
        SELECT d::date::text AS bucket,
          (SELECT COUNT(DISTINCT session_id) FROM public.analytics_events e
             WHERE e.event_type = 'app_install' AND e.created_at >= d AND e.created_at < d + interval '1 day') AS installs,
          (SELECT COUNT(DISTINCT session_id) FROM public.analytics_events e
             WHERE e.created_at >= d AND e.created_at < d + interval '1 day') AS visitors,
          (SELECT COUNT(*) FROM public.profiles p
             WHERE p.created_at >= d AND p.created_at < d + interval '1 day' AND p.deleted_at IS NULL) AS signups,
          (SELECT COUNT(*) FROM public.subscriptions s
             WHERE s.created_at >= d AND s.created_at < d + interval '1 day') AS subscriptions
        FROM generate_series(date_trunc('day', v_since), date_trunc('day', now()), interval '1 day') AS d
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$function$;