import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

/**
 * Neutral placeholder shown while the session is still resolving.
 * Rendering this (instead of the signed-out state) is what stops the app from
 * flashing "please sign in" / the wrong page for a frame before settling.
 */
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-1/2 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted/70" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/**
 * Wrap page bodies that require a session.
 * - session resolving -> skeleton (no flash)
 * - signed out        -> sign-in prompt
 * - signed in         -> children
 */
export function AuthGate({
  children,
  shell = true,
  rows,
  message = "Sign in to continue.",
}: {
  children: ReactNode;
  shell?: boolean;
  rows?: number;
  message?: string;
}) {
  const { user, loading } = useAuth();

  const wrap = (node: ReactNode) => (shell ? <AppShell>{node}</AppShell> : <>{node}</>);

  if (loading) return wrap(<PageSkeleton rows={rows} />);

  if (!user) {
    return wrap(
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link to="/auth" className="btn-brand mt-5 inline-flex">
          Sign in
        </Link>
      </div>,
    );
  }

  return <>{children}</>;
}
