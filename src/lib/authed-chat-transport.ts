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
    fetch: async (input, init) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
  });
}
