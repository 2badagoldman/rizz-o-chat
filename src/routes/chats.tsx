import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { Circle, Search, MessageCircle } from "lucide-react";
import { dmListThreads } from "@/lib/dm.functions";
import { searchUsers } from "@/lib/admin-data.functions";

export const Route = createFileRoute("/chats")({
  head: () => ({ meta: [{ title: "Chats — Rizzla" }] }),
  component: Chats,
});

function Chats() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const listThreads = useServerFn(dmListThreads);
  const search = useServerFn(searchUsers);
  const [threads, setThreads] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    listThreads().then(setThreads).catch(() => {});
  }, [user, listThreads]);

  useEffect(() => {
    if (!user || !q.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      search({ data: { q, limit: 20 } })
        .then((r) => setResults(r.filter((p: any) => p.id !== user.id)))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, user, search]);

  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
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
      <p className="mt-1 text-sm text-muted-foreground">Find anyone, send a message, keep the vibes going.</p>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users by name…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {q.trim() ? (
        <section className="mt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {searching ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </p>
          <div className="mt-2 space-y-2">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate({ to: "/chat/user/$userId", params: { userId: p.id } })}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:bg-primary/5"
              >
                <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
                  {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.display_name ?? "Unnamed"}</p>
                  <p className="text-[11px] capitalize text-muted-foreground">{p.account_type}</p>
                </div>
                <MessageCircle className="h-4 w-4 text-primary" />
              </button>
            ))}
            {!searching && results.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No users match &ldquo;{q}&rdquo;.
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="mt-5 space-y-2">
          {jen ? (
            <Link
              to="/chat/$hostId"
              params={{ hostId: jen.id }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card hover:bg-primary/5"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-glow" style={{ background: jen.gradient }}>
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
                <p className="mt-0.5 truncate text-xs text-muted-foreground">hey! so glad you&apos;re actually testing this with me 💌</p>
              </div>
            </Link>
          ) : null}

          {threads.map((t) => (
            <Link
              key={t.peerId}
              to="/chat/user/$userId"
              params={{ userId: t.peerId }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-primary/5"
            >
              <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
                {(t.profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{t.profile?.display_name ?? "User"}</p>
                  <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                    {new Date(t.lastAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {t.lastFromMe ? "You: " : ""}{t.lastBody}
                </p>
              </div>
            </Link>
          ))}

          <Link
            to="/discover"
            className="block rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground hover:bg-primary/5"
          >
            Discover more hosts →
          </Link>
        </div>
      )}
    </AppShell>
  );
}
