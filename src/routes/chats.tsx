import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { Circle } from "lucide-react";

export const Route = createFileRoute("/chats")({
  head: () => ({ meta: [{ title: "Chats — Rizzla" }] }),
  component: Chats,
});

function Chats() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <AppShell>
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  if (!user) {
    return (
      <AppShell>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl">Sign in to see your chats</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  const jen = DEMO_HOSTS.find((h) => h.id === "demo-jen");

  return (
    <AppShell>
      <h1 className="pt-6 text-2xl font-bold">Chats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your DMs with hosts you&apos;ve joined.
      </p>

      <div className="mt-5 space-y-2">
        {jen ? (
          <Link
            to="/chat/$hostId"
            params={{ hostId: jen.id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card hover:bg-primary/5"
          >
            <div
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-glow"
              style={{ background: jen.gradient }}
            >
              <img src={rizzAiLogo.url} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate font-semibold">{jen.name}</p>
                <span className="ml-2 shrink-0 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-white">Free</span>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <Circle className="h-2 w-2 fill-emerald-500" /> Online now
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                hey! so glad you&apos;re actually testing this with me 💌
              </p>
            </div>
          </Link>
        ) : null}

        <Link
          to="/discover"
          className="block rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground hover:bg-primary/5"
        >
          Discover more hosts →
        </Link>
      </div>
    </AppShell>
  );
}
