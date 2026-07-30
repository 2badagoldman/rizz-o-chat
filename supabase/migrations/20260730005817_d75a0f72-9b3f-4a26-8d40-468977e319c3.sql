-- Clean up any malformed existing rows so the constraint can apply
DELETE FROM public.chat_theme_prefs
WHERE scope_key !~ '^(dm|host|room):[A-Za-z0-9_.:-]{1,128}$'
   OR skin NOT IN ('brand','midnight','ocean','sunset','mint','lavender','noir');

ALTER TABLE public.chat_theme_prefs
  ADD CONSTRAINT chat_theme_prefs_scope_key_format
  CHECK (scope_key ~ '^(dm|host|room):[A-Za-z0-9_.:-]{1,128}$');

ALTER TABLE public.chat_theme_prefs
  ADD CONSTRAINT chat_theme_prefs_skin_allowed
  CHECK (skin IN ('brand','midnight','ocean','sunset','mint','lavender','noir'));

REVOKE ALL ON public.chat_theme_prefs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_theme_prefs TO authenticated;
GRANT ALL ON public.chat_theme_prefs TO service_role;