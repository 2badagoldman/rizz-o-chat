import { AvatarImg } from "@/components/Avatar";
import { Link } from "@tanstack/react-router";
import { Bell, MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

function initials(name: string | null) {
  return (name ?? "?").slice(0, 1).toUpperCase();
}

/**
 * Dashboard notification centre — live unread DM counts with per-sender rows.
 */
export function NotificationsCard() {
  const { total, byPeer, senders, latestAt, loading } = useUnreadMessages();

  const rows = senders
    .map((s) => ({ ...s, count: byPeer[s.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative">
            <Bell className="h-4 w-4 text-primary" />
            {total > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-destructive" />
            ) : null}
          </span>
          Notifications
        </h2>
        {total > 0 ? (
          <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            {total > 99 ? "99+" : total} new
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-muted-foreground">Checking your inbox…</p>
      ) : total === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          You&apos;re all caught up — no unread messages.
        </p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {rows.map((s) => (
              <Link
                key={s.id}
                to="/chat/user/$userId"
                params={{ userId: s.id }}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 p-2.5 transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-brand font-bold text-white">
                  <AvatarImg
                    src={s.avatar_url}
                    name={s.display_name}
                    className="h-full w-full"
                    fallbackClassName="h-full w-full bg-transparent text-white"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.display_name ?? "Someone"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.count} unread message{s.count === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                  {s.count > 99 ? "99+" : s.count}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            {latestAt ? (
              <p className="text-[11px] text-muted-foreground">
                Latest {new Date(latestAt).toLocaleString()}
              </p>
            ) : (
              <span />
            )}
            <Link
              to="/chats"
              className="flex items-center gap-1 text-xs font-semibold text-gradient-brand"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Open chats
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
