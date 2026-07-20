import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Rizz Social" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  component: AuthPage,
});

function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

type Mode = "signin" | "signup";
type Role = "member" | "host";
type Gender = "female" | "male" | "nonbinary" | "other";


function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("member");
  const [gender, setGender] = useState<Gender>("female");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);

  useEffect(() => {
    if (!loading && user) {
      if (nextPath !== "/") window.location.href = nextPath;
      else router.navigate({ to: "/" });
    }
  }, [loading, user, router, nextPath]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!ageConfirmed) {
          setError("You must confirm you are 18 or older.");
          setBusy(false);
          return;
        }
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + nextPath,
            data: {
              account_type: role,
              display_name: displayName || email.split("@")[0],
              age_confirmed: true,
              gender: role === "host" ? gender : undefined,
            },
          },
        });
        if (err) throw err;
        try { localStorage.setItem("rizzla:showWelcome", "1"); } catch {}
        // Send new Hosts straight into the creator-studio onboarding wizard,
        // unless a specific post-auth destination was requested.
        if (role === "host" && nextPath === "/") {
          router.navigate({ to: "/host/onboarding" });
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      if (nextPath !== "/") window.location.href = nextPath;
      else router.navigate({ to: "/" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    if (mode === "signup" && !ageConfirmed) {
      setError("Confirm you are 18+ before continuing with Google.");
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + nextPath,
    });
    if (result.error) setError(result.error.message ?? "Google sign-in failed");
  };

  return (
    <AppShell hideNav>
      <header className="pt-6 text-center">
        <img
          src={rizzAiLogo.url}
          alt="Rizzla"
          className="mx-auto h-16 w-16 rounded-full shadow-glow"
        />
        <p className="mt-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Rizzla AI
        </p>
        <h1 className="mt-1 text-3xl">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-[14px] bg-card p-1 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="rounded-[10px] py-2 font-semibold transition"
            style={{
              background: mode === m ? "var(--gradient-brand)" : "transparent",
              color: mode === m ? "white" : "var(--color-muted-foreground)",
            }}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form className="mt-5 grid gap-3" onSubmit={submit}>
        {mode === "signup" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["member", "host"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="rounded-2xl border p-3 text-left transition"
                  style={{
                    borderColor: role === r ? "transparent" : "var(--color-border)",
                    background: role === r ? "var(--gradient-brand-soft)" : "var(--color-card)",
                  }}
                >
                  <p className="text-sm font-semibold">
                    {r === "member" ? "Join as Member" : "Apply as Host"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {r === "member" ? "Subscribe & chat" : "Run a Friends List"}
                  </p>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
            />
            {role === "host" && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gender <span className="text-muted-foreground/70 normal-case tracking-normal">(women are our focus, all welcome)</span>
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["female", "male", "nonbinary", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className="rounded-[10px] border px-2 py-2 text-xs font-semibold capitalize transition"
                      style={{
                        borderColor: gender === g ? "transparent" : "var(--color-border)",
                        background: gender === g ? "var(--gradient-brand-soft)" : "var(--color-card)",
                        color: gender === g ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                      }}
                    >
                      {g === "nonbinary" ? "Non-binary" : g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        />
        <input
          required
          minLength={6}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        />

        {mode === "signup" && (
          <label className="flex items-start gap-2 rounded-[14px] border border-border bg-card p-3 text-sm">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-primary)]"
              required
            />
            <span>
              I confirm I am <strong>18 or older</strong> and agree to the platform
              guidelines. Hosts are openly disclosed as compensated partners.
            </span>
          </label>
        )}

        {error && (
          <p className="rounded-[10px] bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || (mode === "signup" && !ageConfirmed)}
          className="btn-brand mt-2 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={google}
        className="w-full rounded-[14px] border border-border bg-card px-5 py-3 text-sm font-semibold"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        By continuing you agree to our{" "}
        <Link to="/" className="underline">Terms</Link> and{" "}
        <Link to="/" className="underline">Privacy Policy</Link>.
      </p>
    </AppShell>
  );
}
