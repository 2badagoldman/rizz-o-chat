import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, X, Circle, Inbox, Sparkles } from "lucide-react";
import { DEMO_HOSTS, AI_HOST_IDS, type DemoHost } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { useAuth } from "@/lib/auth";
import { dmListThreads } from "@/lib/dm.functions";
import { listHostThreads } from "@/lib/host-chat-history.functions";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

type InboxEntry = {
  key: string;
  name: string;
  subtitle: string;
  avatar: string;
  badge: string;
  to: "/chat/$hostId" | "/chat/user/$userId";
  params: Record<string, string>;
  online?: boolean;
};

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const loadDms = useServerFn(dmListThreads);
  const loadHostThreads = useServerFn(listHostThreads);
  const [dmThreads, setDmThreads] = useState<any[]>([]);
  const [hostThreadIds, setHostThreadIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user) return;
    loadDms().then((r: any) => setDmThreads(Array.isArray(r) ? r : [])).catch(() => {});
    loadHostThreads()
      .then((r: any) => setHostThreadIds(Array.isArray(r) ? r.map((x: any) => x.hostId) : []))
      .catch(() => {});
  }, [open, user, loadDms, loadHostThreads]);

  // Everyone the member can already reach: AI hosts (free), hosts they've unlocked
  // or chatted with, and every member-to-member DM thread.
  const inbox = useMemo<InboxEntry[]>(() => {
    const byId = new Map(DEMO_HOSTS.map((h) => [h.id, h]));
    const seen = new Set<string>();
    const out: InboxEntry[] = [];

    const pushHost = (h: DemoHost, badge: string) => {
      if (seen.has(h.id)) return;
      seen.add(h.id);
      out.push({
        key: h.id,
        name: `${h.name}, ${h.age}`,
        subtitle: `${h.city} · ${h.teaser}`,
        avatar: hostAvatarThumb(h.id),
        badge,
        to: "/chat/$hostId",
        params: { hostId: h.id },
        online: h.online,
      });
    };

    hostThreadIds.forEach((id) => {
      const h = byId.get(id);
      if (h) pushHost(h, (AI_HOST_IDS as readonly string[]).includes(id) ? "AI · Free" : "Unlocked");
    });
    (AI_HOST_IDS as readonly string[]).forEach((id) => {
      const h = byId.get(id);
      if (h) pushHost(h, "AI · Free");
    });

    dmThreads.forEach((t: any) => {
      const id = t.peerId as string;
      if (!id || seen.has(id)) return;
      seen.add(id);
      out.push({
        key: id,
        name: t.profile?.display_name ?? "Member",
        subtitle: t.lastBody ? `${t.lastFromMe ? "You: " : ""}${t.lastBody}` : "Say hi",
        avatar: t.profile?.avatar_url ?? hostAvatarThumb(id),
        badge: t.profile?.account_type === "host" ? "Host" : "Member",
        to: "/chat/user/$userId",
        params: { userId: id },
      });
    });

    return out;
  }, [dmThreads, hostThreadIds]);

  const term = q.trim().toLowerCase();

  const inboxResults = useMemo(() => {
    if (!term) return inbox.slice(0, 12);
    return inbox.filter((e) => `${e.name} ${e.subtitle} ${e.badge}`.toLowerCase().includes(term)).slice(0, 20);
  }, [inbox, term]);

  const results = useMemo(() => {
    if (!term) return DEMO_HOSTS.slice(0, 24);
    return DEMO_HOSTS.filter((h) =>
      h.name.toLowerCase().includes(term) ||
      h.handle.toLowerCase().includes(term) ||
      h.city.toLowerCase().includes(term) ||
      h.interests.some((i) => i.toLowerCase().includes(term)),
    ).slice(0, 40);
  }, [term]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-foreground/45 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search hosts"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-16 flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-primary/25 bg-card/75 shadow-2xl ring-1 ring-inset ring-white/40 backdrop-blur-2xl backdrop-saturate-150"
      >
        <div className="flex items-center gap-2 border-b border-primary/20 bg-card/40 px-4 py-3">
          <Search className="h-4 w-4 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your chats, hosts, cities…"
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-foreground/45"
          />
          <button onClick={onClose} aria-label="Close search" className="rounded-full p-1 text-foreground/70 hover:bg-primary/10 hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {inboxResults.length > 0 ? (
            <section className="mb-2">
              <p className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary">
                <Inbox className="h-3.5 w-3.5" /> In your inbox
              </p>
              <ul className="grid gap-1">
                {inboxResults.map((e) => (
                  <li key={e.key}>
                    <Link
                      to={e.to as any}
                      params={e.params as any}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                        <img src={e.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {e.online ? (
                          <span className="absolute bottom-0 right-0 grid h-3.5 w-3.5 place-items-center rounded-full bg-card">
                            <Circle className="h-2 w-2 fill-success text-success" />
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{e.subtitle}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                        {e.badge.startsWith("AI") ? <Sparkles className="h-2.5 w-2.5" /> : null}
                        {e.badge}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Discover hosts
          </p>
          {results.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No hosts match &ldquo;{q}&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-1">
              {results.map((h) => (
                <li key={h.id}>
                  <Link
                    to="/host/$hostId"
                    params={{ hostId: h.id }}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                      <img
                        src={hostAvatarThumb(h.id)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {h.online ? (
                        <span className="absolute bottom-0 right-0 grid h-3.5 w-3.5 place-items-center rounded-full bg-card">
                          <Circle className="h-2 w-2 fill-success text-success" />
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {h.name}, {h.age} <span className="text-muted-foreground">· {h.handle}</span>
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{h.city} · {h.interests.slice(0, 3).join(" · ")}</p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-bold text-gradient-brand">
                      {h.id === "demo-jen" ? "Free" : `$${h.priceMonthly}/mo`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
