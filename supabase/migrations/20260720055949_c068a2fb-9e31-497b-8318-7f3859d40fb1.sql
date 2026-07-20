REVOKE EXECUTE ON FUNCTION public.credit_coins(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.friends_list_grace_end(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_friends_list_access(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_coins(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.friends_list_grace_end(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_friends_list_access(uuid, uuid, integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_chat_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_chat_access(uuid, uuid) TO authenticated, service_role;