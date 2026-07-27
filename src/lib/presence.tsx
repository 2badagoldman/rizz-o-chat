import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Live presence: every signed-in client joins one realtime presence channel and
 * tracks its own user id. Anyone listening gets the live set of online users.
 */
const PresenceContext = createContext<Set<string>>(new Set());

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnline(new Set());
      return;
    }
    const channel = supabase.channel("presence:online", {
      config: { presence: { key: user.id } },
    });

    const sync = () => {
      const state = channel.presenceState() as Record<string, unknown[]>;
      setOnline(new Set(Object.keys(state)));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>;
}

export function useOnlineUsers() {
  return useContext(PresenceContext);
}

export function useIsOnline(userId?: string | null) {
  const online = useOnlineUsers();
  return useMemo(() => (userId ? online.has(userId) : false), [online, userId]);
}

/** Small green pulse dot shown on avatars / next to names. */
export function OnlineDot({
  online,
  className = "",
  label = "Online now",
}: {
  online: boolean;
  className?: string;
  label?: string;
}) {
  if (!online) return null;
  return (
    <span
      className={`relative inline-flex h-3 w-3 shrink-0 ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
    </span>
  );
}
