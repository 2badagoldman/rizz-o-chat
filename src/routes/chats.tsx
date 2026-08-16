import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS, AI_HOST_IDS, type DemoHost } from "@/lib/demo-hosts";
import { readTasteTranscript } from "@/lib/taste-chat";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { Circle, Search, MessageCircle, Sparkles, X } from "lucide-react";
import { dmListThreads } from "@/lib/dm.functions";
import { searchUsers } from "@/lib/admin-data.functions";
import { pageHead } from "@/lib/seo";
import { OnlineDot, useOnlineUsers } from "@/lib/presence";
import { KycInboxNotice } from "@/components/KycInboxNotice";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { readLikes, removeLike, subscribeLikes } from "@/lib/swipe-likes";

import { PageSkeleton } from "@/components/AuthGate";
export const Route = createFileRoute("/chats")({
  head: () => pageHead({
    path: "/chats",
    title: "Your chats \u2014 Crush",
    description: "All your Crush conversations in one place. Chat with verified creators and friends.",
    noindex: true,
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

function ProspectsYouLike() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(readLikes());
    sync();
    return subscribeLikes(sync);
  }, []);

  const hosts = useMemo<DemoHost[]>(
    () =>
      ids
        .map((id) => DEMO_HOSTS.find((h) => h.id === id))
        .filter((h): h is DemoHost => !!h)
        .reverse(),
    [ids],
  );

  if (hosts.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Prospects you like · {hosts.length}
        </p>
        <Link to="/swipe" className="text-[11px] font-semibold text-primary">
          Swipe more →
        </Link>
      </div>
      <div className="mt-2 space-y-2">
        {hosts.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3"
          >
            <Link to="/host/$hostId" params={{ hostId: h.id }} className="shrink-0">
              <img
                src={hostAvatarThumb(h.id)}
                alt={h.name}
                loading="lazy"
                className="h-12 w-12 rounded-full object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {h.name}, {h.age}
              </p>
              <p className="truncate text-xs text-muted-foreground">{h.city} · You swiped right</p>
            </div>
            <Link
              to="/chat/$hostId"
              params={{ hostId: h.id }}
              className="shrink-0 rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Chat
            </Link>
            <button
              type="button"
              onClick={() => removeLike(h.id)}
              aria-label={`Remove ${h.name} from prospects`}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
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
  const onlineUsers = useOnlineUsers();
  const { byPeer: unreadByPeer, total: unreadTotal } = useUnreadMessages();

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

  // A conversation the visitor started on the landing page before joining —
  // surfaced here so they can pick it right back up.
  const [continueChat, setContinueChat] = useState<{ host: DemoHost; preview: string } | null>(null);
  useEffect(() => {
    const t = readTasteTranscript();
    if (!t) return;
    const host = DEMO_HOSTS.find((h) => h.id === t.hostId);
    if (!host) return;
    const last = t.messages[t.messages.length - 1] as any;
    const preview = Array.isArray(last?.parts)
      ? last.parts.map((pt: any) => (pt?.type === "text" ? pt.text : "")).join("").trim()
      : "";
    setContinueChat({ host, preview });
  }, []);

  if (loading) {
    return (
      <AppShell>
        <p className="pt-10 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  const ContinueCard = continueChat ? (
    <Link
      to="/chat/$hostId"
      params={{ hostId: continueChat.host.id }}
      className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-gradient-brand-soft px-3 py-3"
    >
      <img
        src={hostAvatarThumb(continueChat.host.id)}
        alt={continueChat.host.name}
        width={44}
        height={44}
        className="h-11 w-11 rounded-full object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">
          Continue with {continueChat.host.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {continueChat.preview || "She's still typing to you…"}
        </span>
      </span>
      <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
        Open
      </span>
    </Link>
  ) : null;

  const AiRoster = (
    <section className="mt-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Chat free with our AI creators</h2>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {aiHosts.length} signature creators — powered by Crush AI. Free to chat, no signup required.
      </p>
      <div className="mt-3 space-y-2">
        {aiHosts.map((h) => (
          <AiHostRow key={h.id} h={h} />
        ))}
      </div>
    </section>
  );

  // Signed-out visitors: search across AI hosts + full AI roster below.
  if (loading) return <AppShell><PageSkeleton /></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <h1 className="pt-6 text-2xl font-bold">Chats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat one of our signature creators right now — no signup needed.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search AI creators by name, handle, or city…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <ProspectsYouLike />

        {q.trim() ? (
          <section className="mt-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {aiMatches.length} AI creator{aiMatches.length === 1 ? "" : "s"} match &ldquo;{q}&rdquo;
            </p>
            <div className="mt-2 space-y-2">
              {aiMatches.map((h) => (
                <AiHostRow key={h.id} h={h} />
              ))}
              {aiMatches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No AI creators match. Try a name like &ldquo;Jen&rdquo; or a city like &ldquo;Miami&rdquo;.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          AiRoster
        )}

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-center shadow-card">
          <p className="text-sm">Ready for the full app — real creators, Rooms, gifts, invites?</p>
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

      <KycInboxNotice />

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search AI creators or members by name…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {q.trim() ? (
        <>
          {aiMatches.length > 0 ? (
            <section className="mt-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                AI creators · {aiMatches.length}
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
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
                      {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <OnlineDot online={onlineUsers.has(p.id)} className="absolute -bottom-0.5 -right-0.5" />
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
          {ContinueCard}
          <ProspectsYouLike />
          {AiRoster}

          {threads.length > 0 ? (
            <section className="mt-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Your conversations{unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}
              </p>
              <div className="mt-2 space-y-2">
                {threads.map((t) => (
                  <Link
                    key={t.peerId}
                    to="/chat/user/$userId"
                    params={{ userId: t.peerId }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-primary/5"
                  >
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-brand grid place-items-center font-bold text-white">
                        {(t.profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <OnlineDot online={onlineUsers.has(t.peerId)} className="absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-semibold">{t.profile?.display_name ?? "User"}</p>
                        <span className="ml-2 flex shrink-0 items-center gap-1.5">
                          {(unreadByPeer[t.peerId] ?? 0) > 0 ? (
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                              {unreadByPeer[t.peerId] > 99 ? "99+" : unreadByPeer[t.peerId]}
                            </span>
                          ) : null}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(t.lastAt).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                      <p className={"mt-0.5 truncate text-xs " + ((unreadByPeer[t.peerId] ?? 0) > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
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
            Discover real creators →
          </Link>
        </>
      )}
    </AppShell>
  );
}
