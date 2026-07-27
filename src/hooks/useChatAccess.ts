import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { getChatAccess } from "@/lib/chat-access.functions";
import type { ChatAccess } from "@/lib/chat-access.server";

/**
 * 7-day free chat trial, then Rizz Gold / Diamond is required.
 * Hosts are never gated.
 */
export function useChatAccess() {
  const { user } = useAuth();
  const fetchAccess = useServerFn(getChatAccess);
  const [access, setAccess] = useState<ChatAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAccess(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAccess({ data: undefined as never })
      .then((a) => {
        if (!cancelled) setAccess(a as ChatAccess);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return {
    access,
    loading,
    allowed: access?.allowed ?? true,
    locked: access ? !access.allowed : false,
    onTrial: access?.reason === "trial",
    daysLeft: access?.daysLeft ?? 0,
  };
}
