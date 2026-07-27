-- Showcase brain settings: explicit admin-only write access
CREATE POLICY "Admins manage settings insert" ON public.showcase_brain_settings
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage settings update" ON public.showcase_brain_settings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Showcase brain runs: admins may clear history; inserts stay service-role only
CREATE POLICY "Admins delete runs" ON public.showcase_brain_runs
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.showcase_brain_settings TO authenticated;
GRANT SELECT, DELETE ON public.showcase_brain_runs TO authenticated;
GRANT ALL ON public.showcase_brain_settings TO service_role;
GRANT ALL ON public.showcase_brain_runs TO service_role;
GRANT ALL ON public.webhook_events TO service_role;
