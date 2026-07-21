
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS messages_pair_created_idx
  ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_recipient_created_idx
  ON public.messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_created_idx
  ON public.messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS room_messages_room_created_idx
  ON public.room_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS list_memberships_member_idx
  ON public.list_memberships (member_id, status);
CREATE INDEX IF NOT EXISTS list_memberships_list_idx
  ON public.list_memberships (list_id, status);

CREATE INDEX IF NOT EXISTS friends_lists_host_idx
  ON public.friends_lists (host_id);

CREATE INDEX IF NOT EXISTS earnings_ledger_host_created_idx
  ON public.earnings_ledger (host_id, created_at DESC);
CREATE INDEX IF NOT EXISTS earnings_ledger_created_idx
  ON public.earnings_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS host_payouts_host_status_idx
  ON public.host_payouts (host_id, status);

CREATE INDEX IF NOT EXISTS gifts_recipient_created_idx
  ON public.gifts (recipient_host_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gifts_sender_created_idx
  ON public.gifts (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS profiles_account_type_idx
  ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx
  ON public.profiles USING gin (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx
  ON public.referrals (referrer_host_id);

CREATE INDEX IF NOT EXISTS base_subscriptions_status_idx
  ON public.base_subscriptions (status);

CREATE INDEX IF NOT EXISTS profile_media_user_created_idx
  ON public.profile_media (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS showcase_media_active_order_idx
  ON public.showcase_media (is_active, sort_order);

-- Ensure realtime broadcasts for live chat surfaces
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='room_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages';
  END IF;
END $$;
