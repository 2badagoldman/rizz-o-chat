CREATE INDEX IF NOT EXISTS profiles_type_created_idx ON public.profiles (account_type, created_at DESC);
CREATE INDEX IF NOT EXISTS host_rooms_public_created_idx ON public.host_rooms (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON public.analytics_events (event_type, created_at DESC);
DROP INDEX IF EXISTS public.room_messages_room_idx;
ANALYZE public.profiles;
ANALYZE public.host_rooms;
ANALYZE public.subscriptions;