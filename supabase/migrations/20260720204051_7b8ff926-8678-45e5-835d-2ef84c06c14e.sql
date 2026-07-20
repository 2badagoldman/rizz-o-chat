
-- ============ profiles / friends_lists: no anonymous reads ============
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lists viewable by everyone" ON public.friends_lists;
CREATE POLICY "Lists viewable by authenticated"
  ON public.friends_lists FOR SELECT TO authenticated USING (true);

-- ============ profile_media: owner + members with chat access ============
DROP POLICY IF EXISTS "Users can view all profile media" ON public.profile_media;
CREATE POLICY "Profile media viewable by owner or friends"
  ON public.profile_media FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_chat_access(auth.uid(), user_id)
  );

-- ============ storage: avatars + profile-media ============
DROP POLICY IF EXISTS "Avatars readable by authenticated" ON storage.objects;
CREATE POLICY "Avatars readable by owner or friends"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_chat_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

DROP POLICY IF EXISTS "Profile media readable by authenticated" ON storage.objects;
CREATE POLICY "Profile media readable by owner or friends"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_chat_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

-- ============ Lock down SECURITY DEFINER functions ============
-- Trigger-only helpers: not user-callable.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Webhook / server-only helpers: reachable only via service_role.
REVOKE ALL ON FUNCTION public.credit_coins(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_friends_list_access(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.friends_list_grace_end(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Admin dashboards: keep for authenticated (they gate on has_role internally), remove anon.
REVOKE ALL ON FUNCTION public.admin_platform_metrics(timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_top_hosts(timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_metrics(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_hosts(timestamptz, integer) TO authenticated;

-- Host self-stats: authenticated only.
REVOKE ALL ON FUNCTION public.host_self_stats(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.host_self_stats(timestamptz) TO authenticated;

-- RLS helpers: keep for authenticated (used inside policies), remove anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_chat_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_chat_access(uuid, uuid) TO authenticated;
