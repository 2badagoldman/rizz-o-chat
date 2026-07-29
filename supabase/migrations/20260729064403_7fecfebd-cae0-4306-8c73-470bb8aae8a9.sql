CREATE TABLE public.chat_theme_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_key text NOT NULL,
  skin text NOT NULL DEFAULT 'brand',
  high_contrast boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_theme_prefs TO authenticated;
GRANT ALL ON public.chat_theme_prefs TO service_role;

ALTER TABLE public.chat_theme_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own chat themes"
ON public.chat_theme_prefs FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_chat_theme_prefs_updated_at
BEFORE UPDATE ON public.chat_theme_prefs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();