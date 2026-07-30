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
      className="fixed left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[440px] -translate-x-1/2 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/65 shadow-pop backdrop-blur-2xl"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      aria-label="Primary"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-brand opacity-70"
      />
      <ul className="relative grid grid-cols-5">
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
                className="press-spring relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold"
                style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-2xl transition-all duration-300 ${
                    active ? "bg-gradient-brand-soft ring-1 ring-primary/25 scale-105" : "scale-100"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

}
