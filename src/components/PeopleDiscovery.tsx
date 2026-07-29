import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Search, X, MessageCircle, Sparkle, Crown } from "lucide-react";
import { discoverPeople, type PersonRow } from "@/lib/people.functions";
import { OnlineDot, useOnlineUsers } from "@/lib/presence";
import { useAuth } from "@/lib/auth";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

interface Props {
  open: boolean;
  onClose: () => void;
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
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<"all" | "member" | "host">("all");
  const onlineUsers = useOnlineUsers();

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["discover-people", debounced],
    queryFn: () => fetchPeople({ data: { q: debounced, limit: 60 } }),
    enabled: open && !!user,
    refetchInterval: open ? 20_000 : false,
  });

  const all = useMemo(() => (data ?? []) as PersonRow[], [data]);
  const people = useMemo(
    () => (tab === "all" ? all : all.filter((p) => p.account_type === tab)),
    [all, tab],
  );
  const weekCount = useMemo(
    () => all.filter((p) => Date.now() - new Date(p.created_at).getTime() < 7 * 864e5).length,
    [all],
  );


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
                ? "Search by name or exact email"
                : "Join the rush as everyone finds their crush on Crush."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close find people"
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
            placeholder="Search by username or exact email…"
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

        <div className="mt-3 flex gap-2 px-4">
          {([
            { key: "all", label: "Everyone" },
            { key: "member", label: "Members" },
            { key: "host", label: "Hosts" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                tab === t.key
                  ? "border-transparent text-white shadow-glow"
                  : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground"
              }`}
              style={tab === t.key ? { background: "var(--gradient-brand)" } : undefined}
            >
              {t.label}
            </button>
          ))}
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
          ) : people.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[15px] font-extrabold tracking-tight text-foreground">
                {debounced ? "No one found" : tab === "all" ? "No new people yet" : `No ${tab === "host" ? "hosts" : "members"} yet`}
              </p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs font-semibold text-muted-foreground">
                {debounced
                  ? debounced.includes("@")
                    ? `No account uses “${debounced}”.`
                    : `Nobody matches “${debounced}”. Try a different name.`
                  : "Check back soon — new faces join Crush every day."}
              </p>
              {(debounced || tab !== "all") ? (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setTab("all");
                  }}
                  className="mt-4 rounded-full px-4 py-2 text-xs font-bold text-white shadow-glow transition active:scale-95"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  Show everyone
                </button>
              ) : null}
            </div>
          ) : (

            <ul className="grid gap-1">
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
                      <img
                        src={p.avatar_url || rizzAiLogo.url}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 rounded-full border-2 border-white object-cover"
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
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
