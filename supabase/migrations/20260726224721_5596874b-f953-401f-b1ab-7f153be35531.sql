DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;
CREATE POLICY "Users can join public rooms"
ON public.room_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.host_rooms hr WHERE hr.id = room_members.room_id AND hr.is_public = true)
);

DROP POLICY IF EXISTS "Host manages room members" ON public.room_members;
CREATE POLICY "Host manages room members"
ON public.room_members FOR ALL TO authenticated
USING (public.is_room_host(room_id, auth.uid()))
WITH CHECK (public.is_room_host(room_id, auth.uid()));