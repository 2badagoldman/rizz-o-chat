import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export interface KycState {
  status: KycStatus;
  dueAt: string | null;
  approvedAt: string | null;
  /** Deadline passed without approval — account is restricted. */
  locked: boolean;
  /** Whole days remaining before the deadline (0 when passed). */
  daysLeft: number;
  hoursLeft: number;
  loading: boolean;
  refresh: () => void;
}

const EMPTY: Omit<KycState, "refresh"> = {
  status: "none",
  dueAt: null,
  approvedAt: null,
  locked: false,
  daysLeft: 7,
  hoursLeft: 168,
  loading: true,
};

export function useKyc(): KycState {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState(EMPTY);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ ...EMPTY, loading: false });
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase.rpc("my_kyc_state");
      if (!alive) return;
      const row = (data ?? {}) as {
        status?: KycStatus;
        due_at?: string;
        approved_at?: string | null;
        locked?: boolean;
      };
      const due = row.due_at ? new Date(row.due_at).getTime() : 0;
      const msLeft = Math.max(0, due - Date.now());
      setState({
        status: row.status ?? "none",
        dueAt: row.due_at ?? null,
        approvedAt: row.approved_at ?? null,
        locked: Boolean(row.locked),
        daysLeft: Math.floor(msLeft / 86_400_000),
        hoursLeft: Math.ceil(msLeft / 3_600_000),
        loading: false,
      });
    })();
    return () => {
      alive = false;
    };
  }, [user, authLoading, nonce]);

  return { ...state, refresh };
}
