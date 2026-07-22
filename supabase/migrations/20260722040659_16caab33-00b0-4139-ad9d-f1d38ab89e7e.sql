
CREATE TABLE public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  device TEXT,
  country TEXT,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX analytics_events_session_idx ON public.analytics_events (session_id);
CREATE INDEX analytics_events_type_idx ON public.analytics_events (event_type);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read all events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.war_room_metrics(_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz := now() - make_interval(hours => _hours);
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'window_hours', _hours,
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
        GROUP BY 1 ORDER BY ct DESC LIMIT 15
      ) c
    ),
    'timeseries', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY bucket), '[]'::jsonb) FROM (
        SELECT date_trunc('hour', created_at) AS bucket,
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
$$;

REVOKE ALL ON FUNCTION public.war_room_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.war_room_metrics(integer) TO authenticated;
