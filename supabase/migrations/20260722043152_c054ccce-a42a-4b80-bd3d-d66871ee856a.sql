
-- 1. Scoring columns on showcase_media
ALTER TABLE public.showcase_media
  ADD COLUMN IF NOT EXISTS impressions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dismisses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_score real NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS ai_caption_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS original_caption text;

-- 2. Brain settings (single row)
CREATE TABLE IF NOT EXISTS public.showcase_brain_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  cadence_minutes integer NOT NULL DEFAULT 60,
  reel_size integer NOT NULL DEFAULT 8,
  refresh_caption_after_hours integer NOT NULL DEFAULT 24,
  tone text NOT NULL DEFAULT 'playful, flirty, elite, inviting',
  last_run_at timestamptz,
  last_run_note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.showcase_brain_settings TO authenticated;
GRANT ALL ON public.showcase_brain_settings TO service_role;
ALTER TABLE public.showcase_brain_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read settings" ON public.showcase_brain_settings;
CREATE POLICY "Admins read settings" ON public.showcase_brain_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.showcase_brain_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. Brain run log
CREATE TABLE IF NOT EXISTS public.showcase_brain_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  trigger text NOT NULL,
  items_scored integer NOT NULL DEFAULT 0,
  captions_refreshed integer NOT NULL DEFAULT 0,
  note text
);

GRANT SELECT ON public.showcase_brain_runs TO authenticated;
GRANT ALL ON public.showcase_brain_runs TO service_role;
ALTER TABLE public.showcase_brain_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read runs" ON public.showcase_brain_runs;
CREATE POLICY "Admins read runs" ON public.showcase_brain_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Anonymous impression/dismiss/complete counter (safe, no PII)
CREATE OR REPLACE FUNCTION public.log_showcase_event(_id uuid, _event text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event = 'impression' THEN
    UPDATE public.showcase_media SET impressions = impressions + 1 WHERE id = _id;
  ELSIF _event = 'dismiss' THEN
    UPDATE public.showcase_media SET dismisses = dismisses + 1 WHERE id = _id;
  ELSIF _event = 'complete' THEN
    UPDATE public.showcase_media SET completes = completes + 1 WHERE id = _id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_showcase_event(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_showcase_event(uuid, text) TO anon, authenticated;

-- 5. Ranked reel: top N by (ai_score * engagement) with light randomness so
--    each pull is unique across sessions. Safe public read.
CREATE OR REPLACE FUNCTION public.get_showcase_reel(_limit integer DEFAULT 8)
RETURNS TABLE(
  id uuid,
  caption text,
  media_type text,
  storage_path text,
  score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scored AS (
    SELECT
      m.id,
      m.caption,
      m.media_type::text AS media_type,
      m.storage_path,
      -- engagement: completes are +, dismisses are -, impressions normalize
      GREATEST(0.05,
        m.ai_score
        + LEAST(0.4, m.completes::real / NULLIF(m.impressions,0)::real)
        - LEAST(0.4, m.dismisses::real / NULLIF(m.impressions,0)::real)
      )::real AS score
    FROM public.showcase_media m
    WHERE m.is_active = true
  )
  SELECT id, caption, media_type, storage_path, score
  FROM scored
  ORDER BY (score * (0.7 + random() * 0.6)) DESC
  LIMIT GREATEST(1, _limit);
$$;

REVOKE ALL ON FUNCTION public.get_showcase_reel(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_showcase_reel(integer) TO anon, authenticated;
