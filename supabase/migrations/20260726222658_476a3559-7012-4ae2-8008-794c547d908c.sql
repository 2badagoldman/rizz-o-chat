GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_rooms TO authenticated;
GRANT ALL ON public.host_rooms TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;