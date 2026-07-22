import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronRight,
  MessageCircle,
  Coins,
} from "lucide-react";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

type IconType = typeof UserIcon;
type Row = {
  label: string;
  to: string;
  icon: IconType;
  tint: string;
  params?: Record<string, string>;
  hint?: string;
  badge?: string;
};

// iOS-Settings style: each row gets a saturated tinted rounded-square icon.
const LIVE: Row[] = [
  { label: "My profile", to: "/profile", icon: UserIcon, tint: "#ff3d9a", hint: "Photos, bio, media" },
  { label: "Messages", to: "/chats", icon: MessageCircle, tint: "#c34fff", hint: "Chats & rooms" },
  { label: "Coins & gifts", to: "/coins", icon: Coins, tint: "#ff9a3d", hint: "Top up, send love" },
  { label: "Membership", to: "/subscriptions", icon: Heart, tint: "#ff2d75", hint: "VIP perks" },
];

const SOON: Array<{ label: string; slug: string; icon: IconType; tint: string; hint: string }> = [
  { label: "Rizzla News",  slug: "news",      icon: Newspaper,  tint: "#5a1fbf", hint: "Stories & drops" },
  { label: "Rizzla Store", slug: "store",     icon: ShoppingBag, tint: "#e84393", hint: "Merch & bundles" },
  { label: "Events",       slug: "events",    icon: Calendar,   tint: "#ff6b35", hint: "Live nights" },
  { label: "Games",        slug: "games",     icon: Gamepad2,   tint: "#6c5ce7", hint: "Play together" },
  { label: "Gift shop",    slug: "gift-shop", icon: Gift,       tint: "#ff3d9a", hint: "Curated gifts" },
];

const FOOT: Row[] = [
  { label: "Settings", to: "/profile", icon: Settings, tint: "#8a8a8f" },
  { label: "Help & support", to: "/soon/$feature", icon: HelpCircle, tint: "#3d8dff", params: { feature: "help" } },
];

export function SideDrawer({ open, onClose }: Props) {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsAdmin(!!data); });
    return () => { cancelled = true; };
  }, [user]);


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

  const displayName =
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[86%] max-w-[380px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main menu"
        role="dialog"
      >
        {/* Frosted glass shell */}
        <div
          className="relative flex h-full flex-col overflow-hidden border-r border-white/40 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.35)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,245,250,0.94) 55%, rgba(245,240,255,0.96) 100%)",
            backdropFilter: "saturate(180%) blur(30px)",
            WebkitBackdropFilter: "saturate(180%) blur(30px)",
          }}
        >
          {/* Aurora glow behind header */}
          <div
            className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full opacity-70 blur-3xl"
            style={{ background: "radial-gradient(circle, #ff3d9a 0%, transparent 65%)" }}
          />
          <div
            className="pointer-events-none absolute -top-10 right-0 h-48 w-48 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, #6c5ce7 0%, transparent 65%)" }}
          />

          {/* Header — profile hero */}
          <div className="relative px-5 pt-6 pb-5">
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/70 text-foreground/70 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>

            <Link
              to="/"
              onClick={onClose}
              className="group flex items-center gap-3.5 rounded-2xl p-1.5 -m-1.5 transition-colors hover:bg-white/60"
              aria-label="Go to home"
            >
              <span
                className="relative inline-block shrink-0 rounded-full p-[2.5px] transition-transform group-hover:scale-[1.03]"
                style={{ background: "conic-gradient(from 180deg at 50% 50%, #ff3d9a, #ff9a3d, #6c5ce7, #ff3d9a)" }}
              >
                <img
                  src={rizzAiLogo.url}
                  alt=""
                  className="block h-14 w-14 rounded-full border-2 border-white bg-white object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                  Rizzla
                </p>
                <p className="truncate text-[22px] font-bold leading-tight tracking-tight text-foreground">
                  Hey {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">Friends Always ✦ Welcome back</p>
              </div>
            </Link>
          </div>

          {/* Body */}
          <nav className="relative flex-1 overflow-y-auto px-4 pb-8">
            <Group label="Your space">
              {LIVE.map((r) => (
                <SettingsRow key={r.label} {...r} onNavigate={onClose} />
              ))}
            </Group>

            <Group label="Coming soon" note="Get early access">
              {SOON.map((s) => (
                <SettingsRow
                  key={s.slug}
                  label={s.label}
                  to="/soon/$feature"
                  params={{ feature: s.slug }}
                  icon={s.icon}
                  tint={s.tint}
                  hint={s.hint}
                  badge="Soon"
                  onNavigate={onClose}
                />
              ))}
            </Group>

            <Group label="Account">
              {FOOT.map((r) => (
                <SettingsRow key={r.label} {...r} onNavigate={onClose} />
              ))}
              {isAdmin && (
                <SettingsRow
                  label="Admin"
                  to="/admin"
                  icon={Shield}
                  tint="#0f172a"
                  hint="Portal & controls"
                  onNavigate={onClose}
                />
              )}
              {user ? (
                <button
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-white/80 px-3.5 py-3 text-left shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-[0.99]"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg,#ff5959,#ff2d75)" }}
                  >
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-[15px] font-semibold text-destructive">Log out</span>
                </button>
              ) : (
                <SettingsRow
                  label="Sign in"
                  to="/auth"
                  icon={LogOut}
                  tint="#3d8dff"
                  hint="Continue with email"
                  onNavigate={onClose}
                />
              )}
            </Group>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
              Rizzla · v1.0
            </p>
          </nav>
        </div>
      </aside>
    </>
  );
}

function Group({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-2">
      <div className="mb-2 flex items-end justify-between px-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </h3>
        {note ? (
          <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70">
            {note}
          </span>
        ) : null}
      </div>
      {/* iOS-style grouped card */}
      <div className="overflow-hidden rounded-2xl bg-white/75 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  to,
  icon: Icon,
  tint,
  hint,
  badge,
  params,
  onNavigate,
}: {
  label: string;
  to: string;
  icon: IconType;
  tint: string;
  hint?: string;
  badge?: string;
  params?: Record<string, string>;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      onClick={onNavigate}
      className="group flex items-center gap-3.5 px-3.5 py-2.5 transition-colors first:pt-3 last:pb-3 hover:bg-white/90 border-b border-black/5 last:border-b-0"
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white shadow-sm ring-1 ring-white/40"
        style={{
          background: `linear-gradient(135deg, ${tint}, ${shade(tint, -15)})`,
        }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight text-foreground">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {badge ? (
        <span className="rounded-full bg-gradient-brand px-2 py-[3px] text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
          {badge}
        </span>
      ) : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

// Tiny helper to darken a hex color for the icon-tile gradient endpoint.
function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const f = percent / 100;
  r = Math.max(0, Math.min(255, Math.round(r + r * f)));
  g = Math.max(0, Math.min(255, Math.round(g + g * f)));
  b = Math.max(0, Math.min(255, Math.round(b + b * f)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
