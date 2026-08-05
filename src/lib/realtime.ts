import { supabase } from "@/integrations/supabase/client";

/**
 * Realtime channel names must be unique per subscriber. If two mounted
 * components (or a StrictMode double-mount) ask for the same name, the
 * Supabase client hands back the already-subscribed channel and the next
 * `.on("postgres_changes", ...)` throws — which used to blank the page.
 *
 * Always build channels through this helper so every subscriber gets its own.
 */
export function uniqueChannel(prefix: string) {
  return supabase.channel(`${prefix}-${Math.random().toString(36).slice(2)}`);
}

/** Never let a realtime setup/teardown failure crash the React tree. */
export function safeRemoveChannel(channel: unknown) {
  try {
    if (channel) void supabase.removeChannel(channel as never);
  } catch {
    /* ignore */
  }
}
