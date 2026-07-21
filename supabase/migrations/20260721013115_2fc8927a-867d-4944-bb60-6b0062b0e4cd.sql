
CREATE TABLE public.host_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX host_rooms_host_id_idx ON public.host_rooms(host_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_rooms TO authenticated;
GRANT ALL ON public.host_rooms TO service_role;
ALTER TABLE public.host_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.host_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
CREATE INDEX room_members_user_idx ON public.room_members(user_id);
CREATE INDEX room_members_room_idx ON public.room_members(room_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.host_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_messages_room_idx ON public.room_messages(room_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Helpers (SECURITY DEFINER, avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_room_host(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.host_rooms WHERE id = _room_id AND host_id = _user_id);
$$;
REVOKE ALL ON FUNCTION public.is_room_host(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_room_host(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = _room_id AND user_id = _user_id
    UNION
    SELECT 1 FROM public.host_rooms WHERE id = _room_id AND host_id = _user_id
  );
$$;
REVOKE ALL ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;

-- Policies: host_rooms
CREATE POLICY "Host manages own rooms" ON public.host_rooms
  FOR ALL TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "Members can view rooms they belong to" ON public.host_rooms
  FOR SELECT TO authenticated USING (public.is_room_member(id, auth.uid()));

-- Policies: room_members
CREATE POLICY "Host manages room members" ON public.room_members
  FOR ALL TO authenticated USING (public.is_room_host(room_id, auth.uid()))
  WITH CHECK (
    public.is_room_host(room_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.list_memberships lm
      JOIN public.friends_lists fl ON fl.id = lm.list_id
      WHERE fl.host_id = auth.uid() AND lm.member_id = room_members.user_id AND lm.status = 'active'
    )
  );
CREATE POLICY "Members view own room memberships" ON public.room_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_room_member(room_id, auth.uid()));

-- Policies: room_messages
CREATE POLICY "Room participants read messages" ON public.room_messages
  FOR SELECT TO authenticated USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY "Room participants post messages" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_room_member(room_id, auth.uid()));
CREATE POLICY "Sender or host deletes messages" ON public.room_messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid() OR public.is_room_host(room_id, auth.uid()));

CREATE TRIGGER update_host_rooms_updated_at BEFORE UPDATE ON public.host_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
