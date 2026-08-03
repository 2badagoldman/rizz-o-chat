CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'media',
  media_path text,
  media_type text,
  caption text,
  accent text,
  coin_value integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX stories_author_created_idx ON public.stories (author_id, created_at DESC);
CREATE INDEX stories_expires_idx ON public.stories (expires_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read live stories" ON public.stories
  FOR SELECT TO authenticated USING (expires_at > now() OR author_id = auth.uid());
CREATE POLICY "Authors insert own stories" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors update own stories" ON public.stories
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own stories" ON public.stories
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);
CREATE INDEX story_views_story_idx ON public.story_views (story_id, created_at DESC);

GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Author or viewer reads views" ON public.story_views
  FOR SELECT TO authenticated USING (
    viewer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid())
  );
CREATE POLICY "Viewers record own view" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

CREATE TABLE public.story_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX story_replies_story_idx ON public.story_replies (story_id, created_at DESC);

GRANT SELECT, INSERT ON public.story_replies TO authenticated;
GRANT ALL ON public.story_replies TO service_role;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender or story author reads replies" ON public.story_replies
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid())
  );
CREATE POLICY "Signed-in users reply to stories" ON public.story_replies
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());