CREATE OR REPLACE FUNCTION public.is_room_host(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' OR _user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    THEN EXISTS (SELECT 1 FROM public.host_rooms WHERE id = _room_id AND host_id = _user_id)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' OR _user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    THEN EXISTS (
      SELECT 1 FROM public.room_members WHERE room_id = _room_id AND user_id = _user_id
      UNION
      SELECT 1 FROM public.host_rooms WHERE id = _room_id AND host_id = _user_id
    )
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.is_room_host(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_chat_access(uuid, uuid) TO authenticated;