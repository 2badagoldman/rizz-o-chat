-- 1) User-scoped helpers no longer need elevated privileges: RLS already
--    restricts these tables to the owner, so run them as the caller.
CREATE OR REPLACE FUNCTION public.host_self_stats(_since timestamp with time zone DEFAULT (now() - '30 days'::interval))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT jsonb_build_object(
    'host_share_cents', COALESCE(SUM(host_share_cents), 0),
    'gross_cents', COALESCE(SUM(gross_cents), 0),
    'transactions', COUNT(*),
    'active_friends', (SELECT COUNT(*) FROM public.list_memberships lm
                       JOIN public.friends_lists fl ON fl.id = lm.list_id
                       WHERE fl.host_id = uid AND lm.status = 'active'),
    'lifetime_host_share_cents', (SELECT COALESCE(SUM(host_share_cents),0) FROM public.earnings_ledger WHERE host_id = uid),
    'pending_payout_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE host_id = uid AND status = 'pending'),
    'paid_payout_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE host_id = uid AND status = 'paid')
  ) INTO result
  FROM public.earnings_ledger
  WHERE host_id = uid AND created_at >= _since;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.my_kyc_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); r record;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT kyc_status, kyc_due_at, kyc_approved_at INTO r FROM public.profiles WHERE id = uid;
  RETURN jsonb_build_object(
    'ok', true,
    'status', COALESCE(r.kyc_status::text, 'none'),
    'due_at', r.kyc_due_at,
    'approved_at', r.kyc_approved_at,
    'locked', (COALESCE(r.kyc_status::text,'none') <> 'approved' AND r.kyc_due_at < now())
  );
END; $function$;

-- 2) Admin-only privileged routines: allow the trusted server role to call
--    them (it has no auth.uid()), then lock them to service_role only.
CREATE OR REPLACE FUNCTION public.admin_review_kyc(_submission_id uuid, _approve boolean, _notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user uuid;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.kyc_submissions
     SET status = CASE WHEN _approve THEN 'approved'::public.kyc_status ELSE 'rejected'::public.kyc_status END,
         review_notes = _notes,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _submission_id
   RETURNING user_id INTO v_user;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF _approve THEN
    UPDATE public.profiles
       SET kyc_status = 'approved', kyc_approved_at = now()
     WHERE id = v_user;
  ELSE
    UPDATE public.profiles
       SET kyc_status = 'rejected'
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', v_user);
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_top_hosts(_since timestamp with time zone DEFAULT (now() - '30 days'::interval), _limit integer DEFAULT 20)
 RETURNS TABLE(host_id uuid, display_name text, gross_cents bigint, host_share_cents bigint, platform_cents bigint, transactions bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT e.host_id,
           p.display_name,
           SUM(e.gross_cents)::bigint,
           SUM(e.host_share_cents)::bigint,
           SUM(e.gross_cents - e.host_share_cents)::bigint,
           COUNT(*)::bigint
    FROM public.earnings_ledger e
    LEFT JOIN public.profiles p ON p.id = e.host_id
    WHERE e.created_at >= _since
    GROUP BY e.host_id, p.display_name
    ORDER BY SUM(e.gross_cents) DESC
    LIMIT _limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_platform_metrics(_since timestamp with time zone DEFAULT (now() - '30 days'::interval))
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'gross_cents', COALESCE(SUM(gross_cents), 0),
    'host_share_cents', COALESCE(SUM(host_share_cents), 0),
    'platform_cents', COALESCE(SUM(gross_cents - host_share_cents), 0),
    'transactions', COUNT(*),
    'by_source', (
      SELECT jsonb_object_agg(source, totals) FROM (
        SELECT source::text, jsonb_build_object(
          'gross_cents', SUM(gross_cents),
          'host_share_cents', SUM(host_share_cents),
          'platform_cents', SUM(gross_cents - host_share_cents),
          'count', COUNT(*)
        ) totals
        FROM public.earnings_ledger
        WHERE created_at >= _since
        GROUP BY source
      ) s
    ),
    'active_hosts', (
      SELECT COUNT(*) FROM public.profiles
      WHERE account_type = 'host'
        AND verification_status = 'verified'
        AND deleted_at IS NULL
    ),
    'earning_hosts', (SELECT COUNT(DISTINCT host_id) FROM public.earnings_ledger WHERE created_at >= _since),
    'total_hosts', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'host' AND deleted_at IS NULL),
    'pending_hosts', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'host' AND verification_status = 'pending' AND deleted_at IS NULL),
    'total_members', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'member' AND deleted_at IS NULL),
    'active_subs', (SELECT COUNT(*) FROM public.base_subscriptions WHERE status IN ('active','trialing')),
    'payouts_pending_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE status = 'pending'),
    'payouts_paid_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM public.host_payouts WHERE status = 'paid')
  )
  INTO result
  FROM public.earnings_ledger
  WHERE created_at >= _since;

  RETURN result;
END;
$function$;

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
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
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

-- 3) Lock the admin-only routines down to trusted server code.
REVOKE ALL ON FUNCTION public.admin_platform_metrics(timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_top_hosts(timestamp with time zone, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.war_room_metrics(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_review_kyc(uuid, boolean, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_platform_metrics(timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_top_hosts(timestamp with time zone, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.war_room_metrics(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_review_kyc(uuid, boolean, text) TO service_role;

-- Keep the caller-scoped helpers callable by signed-in users (they now run
-- as the caller, so RLS constrains them).
GRANT EXECUTE ON FUNCTION public.host_self_stats(timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_kyc_state() TO authenticated;