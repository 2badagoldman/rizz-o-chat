import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS, AI_HOST_IDS, type DemoHost } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { Circle, Search, MessageCircle, Sparkles } from "lucide-react";
import { dmListThreads } from "@/lib/dm.functions";
import { searchUsers } from "@/lib/admin-data.functions";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Your chats — Rizz Social" },
      { name: "description", content: "All your Rizz Social conversations in one place. Chat with verified hosts and friends." },
      { property: "og:title", content: "Your chats — Rizz Social" },
      { property: "og:description", content: "All your Rizz Social conversations in one place." },
      { property: "og:url", content: "https://rizzlachat.com/chats" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/chats" }],
  }),

  component: Chats,
});

function AiHostRow({ h }: { h: DemoHost }) {
  return (
    <Link
      to="/chat/$hostId"
      params={{ hostId: h.id }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5"
    >
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-glow"
        style={{ background: h.gradient }}
      >
        <img src={hostAvatarThumb(h.id)} alt={h.name} loading="lazy" className="h-full w-full object-cover" />
        {h.online ? (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate font-semibold">
            {h.name}, {h.age}
          </p>
          <span className="ml-2 shrink-0 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-white">
            AI · Free
          </span>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-emerald-500">
          <Circle className="h-2 w-2 fill-emerald-500" /> {h.city}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{h.teaser}</p>
      </div>
      <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
    </Link>
  );
}

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
    if (!user || !q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      search({ data: { q, limit: 20 } })
        .then((r) => setResults(r.filter((p: any) => p.id !== user.id)))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, user, search]);

  // Full AI host roster, Jen pinned first, then the rest in AI_HOST_IDS order.
  const aiHosts = useMemo<DemoHost[]>(() => {
    const ordered = (AI_HOST_IDS as readonly string[])
      .map((id) => DEMO_HOSTS.find((h) => h.id === id))
      .filter((h): h is DemoHost => !!h);
    const jen = ordered.find((h) => h.id === "demo-jen");
    const rest = ordered.filter((h) => h.id !== "demo-jen");
    return jen ? [jen, ...rest] : ordered;
  }, []);

  // Client-side search across the AI host roster (name / handle / city).
  const aiMatches = useMemo<DemoHost[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return aiHosts.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.handle.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term),
    );
  }, [q, aiHosts]);

  if (loading) {
    return (
      <AppShell>
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  const AiRoster = (
    <section className="mt-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Chat free with our AI hosts</h2>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {aiHosts.length} signature hosts — powered by Rizz AI. Free to chat, no signup required.
      </p>
      <div className="mt-3 space-y-2">
        {aiHosts.map((h) => (
          <AiHostRow key={h.id} h={h} />
        ))}
      </div>
    </section>
  );

  // Signed-out visitors: search across AI hosts + full AI roster below.
  if (!user) {
    return (
      <AppShell>
        <h1 className="pt-6 text-2xl font-bold">Chats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat one of our signature hosts right now — no signup needed.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search AI hosts by name, handle, or city…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {q.trim() ? (
          <section className="mt-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {aiMatches.length} AI host{aiMatches.length === 1 ? "" : "s"} match &ldquo;{q}&rdquo;
            </p>
            <div className="mt-2 space-y-2">
              {aiMatches.map((h) => (
                <AiHostRow key={h.id} h={h} />
              ))}
              {aiMatches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No AI hosts match. Try a name like &ldquo;Jen&rdquo; or a city like &ldquo;Miami&rdquo;.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          AiRoster
        )}

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-center shadow-card">
          <p className="text-sm">Ready for the full app — real hosts, Rooms, gifts, invites?</p>
          <Link to="/auth" className="btn-brand mt-3 inline-flex">
            Create your free account
          </Link>
        </div>
      </AppShell>
    );
  }

  // Signed-in view: unified search over AI hosts + real users. Roster + DM
  // threads render below when the query is empty.
  return (
    <AppShell>
      <h1 className="pt-6 text-2xl font-bold">Chats</h1>
      <p className="mt-1 text-sm text-muted-foreground">Find anyone, send a message, keep the vibes going.</p>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search AI hosts or members by name…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {q.trim() ? (
        <>
          {aiMatches.length > 0 ? (
            <section className="mt-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                AI hosts · {aiMatches.length}
              </p>
              <div className="mt-2 space-y-2">
                {aiMatches.map((h) => (
                  <AiHostRow key={h.id} h={h} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {searching ? "Searching members…" : `Members · ${results.length}`}
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
              {!searching && results.length === 0 && aiMatches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Nothing matches &ldquo;{q}&rdquo; yet.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <>
          {AiRoster}

          {threads.length > 0 ? (
            <section className="mt-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Your conversations</p>
              <div className="mt-2 space-y-2">
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
                        {t.lastFromMe ? "You: " : ""}
                        {t.lastBody}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <Link
            to="/discover"
            className="mt-5 block rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground hover:bg-primary/5"
          >
            Discover real hosts →
          </Link>
        </>
      )}
    </AppShell>
  );
}
