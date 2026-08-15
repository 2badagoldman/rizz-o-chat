import { AvatarImg } from "@/components/Avatar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, X, MessageCircle, Sparkle, Crown } from "lucide-react";
import { discoverPeople, getPublicProfile, type PersonRow } from "@/lib/people.functions";
import { OnlineDot, useOnlineUsers } from "@/lib/presence";
import { useAuth } from "@/lib/auth";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import rizzAiLogo from "@/assets/crush-logo.png.asset.json";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Render as an in-page dropdown panel instead of a full-screen overlay. */
  inline?: boolean;
}

function joinedLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

export function PeopleDiscovery({ open, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchPeople = useServerFn(discoverPeople);
  const fetchProfile = useServerFn(getPublicProfile);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const onlineUsers = useOnlineUsers();

  const { data: myProfile } = useQuery({
    queryKey: ["my-public-profile", user?.id],
    queryFn: () => fetchProfile({ data: { userId: user!.id } }),
    enabled: !!user,
  });
  const isHost = myProfile?.account_type === "host";

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Server-side keyset pagination: we fetch 30 at a time instead of pulling a
  // large slab of the member table on every open.
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["discover-people", debounced],
      initialPageParam: null as string | null,
      queryFn: ({ pageParam }) =>
        fetchPeople({ data: { q: debounced, limit: 30, cursor: pageParam } }),
      getNextPageParam: (last) => last.nextCursor,
      enabled: open && !!user,
      refetchInterval: open ? 60_000 : false,
    });

  const all = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.people) as PersonRow[],
    [data],
  );

  // Members also get the AI hosts in the pool so there's always someone to chat with.
  const aiHosts = useMemo(() => {
    if (isHost) return [];
    const term = debounced.trim().toLowerCase().replace(/^@/, "");
    return DEMO_HOSTS.filter((h) => h.aiEnabled).filter(
      (h) =>
        !term ||
        h.name.toLowerCase().includes(term) ||
        h.handle.toLowerCase().includes(term),
    );
  }, [isHost, debounced]);

  // Keep the list looking alive: hide placeholder accounts (no real photo, so
  // they render the Crush logo) and internal QA/test profiles.
  const people = useMemo(
    () =>
      all.filter((p) => {
        if (!p.avatar_url) return false;
        const name = (p.display_name || "").trim().toLowerCase();
        return !/^(qa|test|demo)\b/.test(name) && !name.includes("qa member");
      }),
    [all],
  );
  const total = people.length + aiHosts.length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] bg-foreground/25 backdrop-blur-xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Find your crush"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-10 flex max-h-[85vh] w-[94%] max-w-[440px] flex-col overflow-hidden rounded-[30px] border border-border/60 bg-card/70 shadow-[0_40px_90px_-30px_rgba(80,20,60,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between px-5 pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/70">Crush</p>
            <h2 className="bg-[linear-gradient(100deg,#ff2d75,#c34fff,#6c5ce7)] bg-clip-text text-[22px] font-black leading-tight text-transparent">
              Find your crush
            </h2>
            <p className="text-[11.5px] text-muted-foreground">
              {debounced
                ? "Searching every username — creators and members"
                : "Join the rush as everyone finds their crush on Crush."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close find your crush"
            className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 text-foreground/70 transition-transform hover:scale-110 active:scale-90"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any username — creators & members…"
            aria-label="Search people"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear people search"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-3 pb-5">
          {!user ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Sign in to find your crush on Crush.</p>
          ) : isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading the newest faces…</p>
          ) : error ? (
            <p className="p-6 text-center text-sm text-destructive">
              Couldn’t load people right now. Pull down to retry in a moment.
            </p>
          ) : total === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[15px] font-extrabold tracking-tight text-foreground">
                {debounced ? "No one found" : isHost ? "No new members yet" : "No creators yet"}
              </p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs font-semibold text-muted-foreground">
                {debounced
                  ? `Nobody matches “${debounced}”. Try their exact username.`
                  : isHost
                    ? "Check back soon — new members join Crush every day."
                    : "Check back soon — new creators join Crush every day."}
              </p>
              {debounced ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="mt-4 rounded-full px-4 py-2 text-xs font-bold text-white shadow-glow transition active:scale-95"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {isHost ? "Show new members" : "Show all creators"}
                </button>
              ) : null}
            </div>
          ) : (

            <ul className="grid gap-1">
              {aiHosts.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-primary/15"
                >
                  <button
                    onClick={() => {
                      onClose();
                      navigate({ to: "/host/$hostId", params: { hostId: h.id } });
                    }}
                    aria-label={`View ${h.name}`}
                    className="relative h-12 w-12 shrink-0 transition active:scale-95"
                  >
                    <img
                      src={hostAvatarThumb(h.id)}
                      alt=""
                      loading="lazy"
                      className="h-12 w-12 rounded-full border-2 border-white object-cover"
                    />
                    <OnlineDot online className="absolute bottom-0 right-0" />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate({ to: "/chat/$hostId", params: { hostId: h.id } });
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold">{h.name}</span>
                        <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="shrink-0 rounded-full bg-gradient-brand px-2 py-[2px] text-[8.5px] font-black uppercase tracking-[0.12em] text-white">
                          AI
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <Sparkle className="h-3 w-3 shrink-0" /> {h.city} · replies instantly
                      </span>
                    </span>
                    <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                </li>
              ))}
              {people.map((p) => {
                const isNew = Date.now() - new Date(p.created_at).getTime() < 7 * 864e5;
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-primary/15">
                    <button
                      onClick={() => {
                        onClose();
                        navigate({ to: "/u/$userId", params: { userId: p.id } });
                      }}
                      aria-label={`View ${p.display_name || "profile"}`}
                      className="relative h-12 w-12 shrink-0 transition active:scale-95"
                    >
                      <AvatarImg
                        src={p.avatar_url || rizzAiLogo.url}
                        name={p.display_name}
                        className="h-12 w-12 rounded-full border-2 border-white"
                        fallbackClassName="h-12 w-12 rounded-full border-2 border-white"
                      />

                      <OnlineDot online={onlineUsers.has(p.id)} className="absolute bottom-0 right-0" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        navigate({ to: "/chat/user/$userId", params: { userId: p.id } });
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold">{p.display_name || "Crush friend"}</span>
                          {p.account_type === "host" ? (
                            <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />
                          ) : null}
                          {isNew ? (
                            <span className="shrink-0 rounded-full bg-gradient-brand px-2 py-[2px] text-[8.5px] font-black uppercase tracking-[0.12em] text-white">
                              New
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Sparkle className="h-3 w-3" /> Joined {joinedLabel(p.created_at)}
                        </span>
                      </span>
                      <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                    </button>
                  </li>

                );
              })}
              {hasNextPage ? (
                <li className="px-2 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-bold text-foreground transition active:scale-95 disabled:opacity-60"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more people"}
                  </button>
                </li>
              ) : null}
            </ul>

          )}
        </div>
      </div>
    </div>
  );
}
