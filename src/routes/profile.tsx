import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Rizz Social" }] }),
  component: Profile,
});

interface ProfileRow {
  display_name: string;
  account_type: "host" | "member";
  verification_status: "pending" | "verified" | "rejected";
  bio: string | null;
}

function Profile() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("display_name, account_type, verification_status, bio")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setProfile(data as ProfileRow);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;

  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl">You&apos;re not signed in</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      footerNote={<>Hosts on Rizz Social are compensated partners.</>}
    >
      <h1 className="pt-6 text-2xl">Profile</h1>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-brand" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {profile?.display_name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {profile?.account_type ?? "member"}
              {profile?.account_type === "host" ? ` · ${profile.verification_status}` : ""}
            </p>
          </div>
        </div>
      </section>

      <button
        className="mt-6 w-full rounded-[14px] border border-border bg-card px-5 py-3 text-sm font-semibold"
        onClick={async () => {
          await signOut();
          router.navigate({ to: "/" });
        }}
      >
        Sign out
      </button>
    </AppShell>
  );
}
