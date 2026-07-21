
-- Add discovery + geo columns to host_rooms
ALTER TABLE public.host_rooms
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

CREATE INDEX IF NOT EXISTS host_rooms_public_geo_idx
  ON public.host_rooms (is_public, lat, lng);

-- Allow anyone signed in to discover public rooms
DROP POLICY IF EXISTS "Public rooms are discoverable" ON public.host_rooms;
CREATE POLICY "Public rooms are discoverable"
  ON public.host_rooms
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Anyone signed in can join a public room themselves
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;
CREATE POLICY "Users can join public rooms"
  ON public.room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.host_rooms hr
      WHERE hr.id = room_id AND hr.is_public = true
    )
  );

-- And leave rooms they joined
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
CREATE POLICY "Users can leave rooms"
  ON public.room_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
