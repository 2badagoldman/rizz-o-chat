import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, Compass, MessageCircle, LayoutDashboard, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                onClick={() => {
                  // Tapping the current tab should feel like a real app: scroll to top + refresh.
                  if (pathname === t.to) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    router.invalidate();
                  }
                }}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
                style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
