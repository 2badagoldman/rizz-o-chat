import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead({
      path: "/reset-password",
      title: "Set a new password \u2014 Crush",
      description: "Choose a new password for your Crush account.",
      noindex: true,
    }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase delivers the recovery session via the URL hash; wait for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => router.navigate({ to: "/" }), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell hideNav>
      <header className="pt-6 text-center">
        <img
          src={rizzAiLogo.url}
          alt="Crush app logo"
          className="mx-auto h-16 w-16 rounded-full shadow-glow"
        />
        <h1 className="mt-3 text-3xl">Set a new password</h1>
      </header>

      {done ? (
        <p className="mt-6 rounded-[14px] border border-border bg-card p-4 text-sm">
          Password updated. Taking you into the app…
        </p>
      ) : (
        <form className="mt-6 grid gap-3" onSubmit={submit}>
          {!ready && (
            <p className="rounded-[10px] bg-card px-3 py-2 text-xs text-muted-foreground">
              Open this page from the reset link in your email. If you did, give it a second.
            </p>
          )}
          <input
            required
            type="password"
            minLength={6}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
          {error && (
            <p className="rounded-[10px] bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <button type="submit" disabled={busy} className="btn-brand mt-2 disabled:opacity-50">
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
