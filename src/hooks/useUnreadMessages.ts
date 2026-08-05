import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { dmUnreadCounts } from "@/lib/dm.functions";

export type UnreadSummary = {
  total: number;
  byPeer: Record<string, number>;
  latestAt: string | null;
  senders: Array<{ id: string; display_name: string | null; avatar_url: string | null }>;
};

const EMPTY: UnreadSummary = { total: 0, byPeer: {}, latestAt: null, senders: [] };

/**
 * Live unread direct-message counts for the signed-in user.
 * Refreshes over realtime so badges update the moment a message lands
 * or the thread is opened and marked read.
 */
export function useUnreadMessages() {
  const { user } = useAuth();
  const fetchCounts = useServerFn(dmUnreadCounts);
  const [data, setData] = useState<UnreadSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    fetchCounts()
      .then((r) => setData(r as UnreadSummary))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, fetchCounts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    // Unique per mount: several components use this hook, and reusing one
    // channel name makes the second `.on()` land after `subscribe()`.
    const channel = supabase
      .channel(`dm-unread-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        () => refreshRef.current(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { ...data, loading, refresh };
}
