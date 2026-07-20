import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [{ title: "Chats — Rizz Social" }],
  }),
  component: Chats,
});

function Chats() {
  const { user, loading } = useAuth();
  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl">Sign in to see your chats</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Friends Lists and DMs live here.
          </p>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <h1 className="pt-6 text-2xl">Chats</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Group chats & DMs land here after you join a Friends List.
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No chats yet.
      </div>
    </AppShell>
  );
}
