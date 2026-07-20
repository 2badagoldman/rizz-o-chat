import { DefaultChatTransport } from "ai";
import { supabase } from "@/integrations/supabase/client";

type Options = { api: string; body?: Record<string, unknown> };

/**
 * DefaultChatTransport that attaches the current Supabase bearer token so the
 * server-side /api/chat and /api/host-chat routes can authenticate the caller.
 */
export function createAuthedChatTransport({ api, body }: Options) {
  return new DefaultChatTransport({
    api,
    body,
    headers: async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}
