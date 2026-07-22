
CREATE OR REPLACE FUNCTION public.war_room_metrics(_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz := now() - make_interval(hours => _hours);
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'window_hours', _hours,
    'server_time', now(),
    'active_now', (
      SELECT COUNT(DISTINCT session_id) FROM public.analytics_events
      WHERE created_at >= now() - interval '5 minutes'
    ),
    'signed_in_now', (
      SELECT COUNT(DISTINCT user_id) FROM public.analytics_events
      WHERE created_at >= now() - interval '5 minutes' AND user_id IS NOT NULL
    ),
    'sessions', (
      SELECT COUNT(DISTINCT session_id) FROM public.analytics_events WHERE created_at >= v_since
    ),
    'users', (
      SELECT COUNT(DISTINCT user_id) FROM public.analytics_events
      WHERE created_at >= v_since AND user_id IS NOT NULL
    ),
    'new_visitors', (
      SELECT COUNT(*) FROM (
        SELECT session_id, MIN(created_at) AS first_seen
        FROM public.analytics_events
        GROUP BY session_id
        HAVING MIN(created_at) >= v_since
      ) n
    ),
    'returning_visitors', (
      SELECT COUNT(DISTINCT a.session_id)
      FROM public.analytics_events a
      WHERE a.created_at >= v_since
        AND EXISTS (
          SELECT 1 FROM public.analytics_events b
          WHERE b.session_id = a.session_id AND b.created_at < v_since
        )
    ),
    'pageviews', (
      SELECT COUNT(*) FROM public.analytics_events WHERE created_at >= v_since AND event_type = 'pageview'
    ),
    'events', (
      SELECT COUNT(*) FROM public.analytics_events WHERE created_at >= v_since
    ),
    'avg_session_seconds', (
      SELECT COALESCE(AVG(dur), 0)::int FROM (
        SELECT EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS dur
        FROM public.analytics_events
        WHERE created_at >= v_since
        GROUP BY session_id
        HAVING COUNT(*) > 1
      ) s
    ),
    'active_paths', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT path, COUNT(DISTINCT session_id) AS sessions
        FROM public.analytics_events
        WHERE created_at >= now() - interval '5 minutes'
          AND event_type = 'pageview' AND path IS NOT NULL
        GROUP BY path ORDER BY sessions DESC LIMIT 10
      ) t
    ),
    'top_pages', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
        FROM public.analytics_events
        WHERE created_at >= v_since AND event_type = 'pageview' AND path IS NOT NULL
        GROUP BY path ORDER BY views DESC LIMIT 15
      ) t
    ),
    'top_referrers', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT COALESCE(NULLIF(referrer,''),'(direct)') AS referrer, COUNT(DISTINCT session_id) AS sessions
        FROM public.analytics_events
        WHERE created_at >= v_since AND event_type = 'pageview'
        GROUP BY 1 ORDER BY sessions DESC LIMIT 10
      ) t
    ),
    'top_sources', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT
          CASE
            WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
            WHEN referrer ~* '^https?://' THEN regexp_replace(referrer, '^https?://(www\.)?([^/]+).*$', '\2')
            ELSE referrer
          END AS source,
          COUNT(DISTINCT session_id) AS sessions
        FROM public.analytics_events
        WHERE created_at >= v_since AND event_type = 'pageview'
        GROUP BY 1 ORDER BY sessions DESC LIMIT 12
      ) t
    ),
    'devices', (
      SELECT COALESCE(jsonb_object_agg(device, ct), '{}'::jsonb) FROM (
        SELECT COALESCE(device,'unknown') AS device, COUNT(DISTINCT session_id) AS ct
        FROM public.analytics_events WHERE created_at >= v_since
        GROUP BY 1
      ) d
    ),
    'countries', (
      SELECT COALESCE(jsonb_object_agg(country, ct), '{}'::jsonb) FROM (
        SELECT COALESCE(country,'unknown') AS country, COUNT(DISTINCT session_id) AS ct
        FROM public.analytics_events WHERE created_at >= v_since
        GROUP BY 1 ORDER BY ct DESC LIMIT 20
      ) c
    ),
    'timeseries', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket), '[]'::jsonb) FROM (
        SELECT date_trunc(CASE WHEN _hours <= 24 THEN 'hour' ELSE 'day' END, created_at) AS bucket,
               COUNT(*) FILTER (WHERE event_type='pageview') AS pageviews,
               COUNT(DISTINCT session_id) AS sessions
        FROM public.analytics_events
        WHERE created_at >= v_since
        GROUP BY 1
      ) t
    ),
    'top_events', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT event_type, COUNT(*) AS ct
        FROM public.analytics_events WHERE created_at >= v_since AND event_type <> 'pageview'
        GROUP BY 1 ORDER BY ct DESC LIMIT 10
      ) t
    ),
    'live_feed', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT
          e.created_at,
          e.event_type,
          e.path,
          COALESCE(e.device,'unknown') AS device,
          COALESCE(e.country,'unknown') AS country,
          COALESCE(NULLIF(e.referrer,''),'(direct)') AS referrer,
          p.display_name AS user_name
        FROM public.analytics_events e
        LEFT JOIN public.profiles p ON p.id = e.user_id
        WHERE e.created_at >= now() - interval '30 minutes'
        ORDER BY e.created_at DESC
        LIMIT 30
      ) t
    ),
    'demographics', (
      SELECT jsonb_build_object(
        'gender', (SELECT COALESCE(jsonb_object_agg(g, ct),'{}'::jsonb) FROM (
          SELECT COALESCE(gender::text,'unset') AS g, COUNT(*) AS ct FROM public.profiles GROUP BY 1
        ) x),
        'account_type', (SELECT COALESCE(jsonb_object_agg(a, ct),'{}'::jsonb) FROM (
          SELECT account_type::text AS a, COUNT(*) AS ct FROM public.profiles GROUP BY 1
        ) y)
      )
    )
  ) INTO result;

  RETURN result;
END;
$function$;
