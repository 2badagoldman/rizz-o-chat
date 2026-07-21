import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  User as UserIcon,
  Newspaper,
  ShoppingBag,
  Calendar,
  Gamepad2,
  Gift,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Shield,
} from "lucide-react";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Item = { label: string; to: string; icon: typeof UserIcon; params?: Record<string, string> };

const LIVE: Item[] = [
  { label: "My profile", to: "/profile", icon: UserIcon },
  { label: "Chats", to: "/chats", icon: Heart },
  { label: "Coins", to: "/coins", icon: Gift },
];

const SOON: Array<{ label: string; slug: string; icon: typeof UserIcon }> = [
  { label: "Rizzla News", slug: "news", icon: Newspaper },
  { label: "Rizzla Store", slug: "store", icon: ShoppingBag },
  { label: "Events", slug: "events", icon: Calendar },
  { label: "Games", slug: "games", icon: Gamepad2 },
  { label: "Gift shop", slug: "gift-shop", icon: Gift },
];

const FOOT: Item[] = [
  { label: "Settings", to: "/profile", icon: Settings },
  { label: "Help", to: "/soon/$feature", icon: HelpCircle, params: { feature: "help" } },
];

export function SideDrawer({ open, onClose }: Props) {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[82%] max-w-[340px] bg-card border-r border-border shadow-2xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main menu"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4 bg-gradient-brand-soft">
          <div className="flex items-center gap-3 min-w-0">
            <span className="ring-story inline-block shrink-0">
              <img src={rizzAiLogo.url} alt="" className="h-11 w-11 rounded-full bg-card" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.user_metadata?.display_name || user?.email || "Guest"}
              </p>
              <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                Rizzla • Friends Always
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-background/60" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-2 overflow-y-auto h-[calc(100%-88px)]">
          <Group label="Your space">
            {LIVE.map((i) => (
              <Row key={i.label} label={i.label} to={i.to} icon={i.icon} onClick={onClose} />
            ))}
          </Group>

          <Group label="Coming soon">
            {SOON.map((i) => (
              <Row
                key={i.slug}
                label={i.label}
                to="/soon/$feature"
                params={{ feature: i.slug }}
                icon={i.icon}
                onClick={onClose}
                badge="Soon"
              />
            ))}
          </Group>

          <Group label="Account">
            {FOOT.map((i) => (
              <Row key={i.label} {...i} onClick={onClose} />
            ))}
            <Row label="Admin" to="/admin" icon={Shield} onClick={onClose} />
            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            ) : (
              <Row label="Sign in" to="/auth" icon={LogOut} onClick={onClose} />
            )}
          </Group>
        </nav>
      </aside>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  to,
  icon: Icon,
  onClick,
  params,
  badge,
}: {
  label: string;
  to: string;
  icon: typeof UserIcon;
  onClick?: () => void;
  params?: Record<string, string>;
  badge?: string;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-gradient-brand text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
