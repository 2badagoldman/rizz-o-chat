import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Keep one stable User object per signed-in identity. Supabase emits a fresh
  // session object on every TOKEN_REFRESHED / tab-focus event; without this,
  // `user` changes reference and every effect keyed on it (chat threads,
  // realtime channels, queries) tears down and re-runs — which reads to the
  // user as the app reloading mid-conversation.
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    const commit = (s: Session | null) => {
      setSession((prev) => {
        if (prev?.user?.id === s?.user?.id && prev?.access_token === s?.access_token) return prev;
        return s;
      });
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => commit(s));
    supabase.auth.getSession().then(({ data }) => commit(data.session));
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const nextUser = session?.user ?? null;
  if (nextUser?.id !== userRef.current?.id) userRef.current = nextUser;
  const user = userRef.current;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  return useContext(AuthContext);
}
