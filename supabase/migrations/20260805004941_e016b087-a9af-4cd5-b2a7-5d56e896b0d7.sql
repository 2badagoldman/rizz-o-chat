GRANT SELECT ON public.host_rooms TO anon;
CREATE POLICY "Anon can browse public rooms"
ON public.host_rooms FOR SELECT TO anon
USING (is_public = true);