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
  Scale,
  ChevronRight,
  MessageCircle,
  Coins,
  UserPlus,
} from "lucide-react";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { useAuth } from "@/lib/auth";
import { PeopleDiscovery } from "./PeopleDiscovery";
import { useIosBillingRestricted } from "@/hooks/useNative";

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
  { label: "Crush News",  slug: "news",      icon: Newspaper,   tint: "#5a1fbf", hint: "Stories & drops" },
  { label: "Crush Store", slug: "store",     icon: ShoppingBag, tint: "#e84393", hint: "Merch & bundles" },
  { label: "Events",       slug: "events",    icon: Calendar,    tint: "#ff6b35", hint: "Live nights" },
  { label: "Games",        slug: "games",     icon: Gamepad2,    tint: "#6c5ce7", hint: "Play together" },
  { label: "Gift shop",    slug: "gift-shop", icon: Gift,        tint: "#ff3d9a", hint: "Curated gifts" },
];

const FOOT: Row[] = [
  { label: "Settings", to: "/profile", icon: Settings, tint: "#5a5a66" },
  { label: "Help & support", to: "/soon/$feature", icon: HelpCircle, tint: "#5a7fff", params: { feature: "help" } },
  { label: "Policies & legal", to: "/legal", icon: Scale, tint: "#3a3a44", hint: "Terms, privacy, refunds" },
];

export function SideDrawer({ open, onClose }: Props) {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const iosRestricted = useIosBillingRestricted();
  // Apple 3.1.1: no external purchase entry points inside the iOS build.
  const liveRows = iosRestricted ? LIVE.filter((r) => r.to !== "/coins") : LIVE;

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    let cancelled = false;
    // has_role() is SECURITY DEFINER, so it works even when RLS hides
    // user_roles rows from the signed-in member.
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => { if (!cancelled) setIsAdmin(data === true); });
    return () => { cancelled = true; };
  }, [user]);


  useEffect(() => {
    if (!open) return;
    // Escape must close the topmost layer only: when "Find people" is open it
    // owns the key, otherwise the drawer would slide away beneath it and leave
    // the app stuck behind an orphaned overlay.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || peopleOpen) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, peopleOpen]);


  const displayName =
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/25 backdrop-blur-xl transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[88%] max-w-[392px] p-2.5 transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-[104%] opacity-60"
        }`}
        aria-label="Main menu"
        aria-hidden={!open}
        inert={!open}
        role="dialog"
        aria-modal={open}
      >
        {/* Frosted glass shell — floating, fully rounded */}
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-border/50 bg-card/70 shadow-[0_40px_90px_-30px_rgba(80,20,60,0.55),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl backdrop-saturate-150"
        >
          {/* Aurora blobs — theme-driven, soft, breathing */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 66%)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 top-16 h-64 w-64 rounded-full opacity-35 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 66%)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-4 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--secondary) 0%, transparent 66%)" }}
          />
          {/* Specular sheen along the top edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_70%,transparent),transparent)]"
          />


          {/* Header — profile hero */}
          <div className="relative px-5 pt-6 pb-4">
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-card/70 text-foreground/70 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:text-foreground active:scale-90"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <a
              href="/"
              className="group flex items-center gap-4 rounded-[26px] p-2 -m-2 transition-colors duration-300 hover:bg-primary/10"
              onClick={(e) => {
                e.preventDefault();
                window.location.assign("/");
              }}
              aria-label="Crush home — reload"
            >
              <span
                className="relative inline-block shrink-0 rounded-full p-[3px] shadow-[0_10px_30px_-10px_rgba(255,61,154,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105 group-active:scale-95"
                style={{ background: "conic-gradient(from 180deg at 50% 50%, #ff3d9a, #ff9a3d, #6c5ce7, #3ddcff, #ff3d9a)" }}
              >
                <img loading="lazy" decoding="async"
                  src={rizzAiLogo.url}
                  alt=""
                  className="block h-16 w-16 rounded-full border-[3px] border-card bg-card object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.28em] text-primary/70">
                  Crush
                </p>
                <p className="truncate bg-[image:var(--gradient-brand)] bg-clip-text text-[26px] font-black leading-tight tracking-tight text-transparent">
                  Hey {displayName}
                </p>
                <p className="truncate text-[11.5px] text-muted-foreground">Friends Always ✦ Welcome back</p>
              </div>
            </a>
          </div>

          {/* Body */}
          <nav className="relative flex-1 overflow-y-auto px-3.5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Group label="Discover people" note="Live" open={open} index={0}>
              <button
                onClick={() => setPeopleOpen(true)}
                className="group relative flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors duration-300 hover:bg-primary/10 active:bg-primary/15"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-white ring-1 ring-white/50 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-active:scale-95"
                  style={{
                    background: "linear-gradient(135deg,#67e8ff,#3d8dff)",
                    boxShadow: "0 10px 20px -10px #3d8dff, inset 0 1px 0 rgba(255,255,255,0.55)",
                  }}
                >
                  <UserPlus className="h-[18px] w-[18px]" strokeWidth={2.35} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold leading-tight tracking-[-0.01em] text-foreground">
                    Find your crush
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                    Join the rush as everyone finds their crush
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            </Group>

            <Group label="Your space" open={open} index={1}>
              {liveRows.map((r) => (
                <SettingsRow key={r.label} {...r} onNavigate={onClose} />
              ))}
            </Group>


            <Group label="Coming soon" note="Get early access" open={open} index={2}>
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

            <Group label="Account" open={open} index={3} variant="solid">
              {FOOT.map((r) => (
                <SettingsRow key={r.label} {...r} onNavigate={onClose} variant="solid" />
              ))}
              {isAdmin && (
                <SettingsRow
                  label="Admin"
                  to="/admin"
                  icon={Shield}
                  tint="#0f172a"
                  hint="Portal & controls"
                  onNavigate={onClose}
                  variant="solid"
                />
              )}
            </Group>

            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="mt-4 flex w-full items-center gap-3.5 rounded-[24px] border border-border/60 bg-card/70 px-4 py-3.5 text-left shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.015] active:scale-[0.97]"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-white shadow-[0_8px_18px_-8px_rgba(255,45,117,0.9),inset_0_1px_0_rgba(255,255,255,0.6)]"
                  style={{ background: "linear-gradient(135deg,#ff8080,#ff2d75)" }}
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={2.4} />
                </span>
                <span className="flex-1 text-[15px] font-bold text-destructive">Log out</span>
              </button>
            ) : (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-border/60 bg-card/70 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
                <SettingsRow
                  label="Sign in"
                  to="/auth"
                  icon={LogOut}
                  tint="#3d8dff"
                  hint="Continue with email"
                  onNavigate={onClose}
                />
              </div>
            )}

            <p className="mt-7 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/60">
              Crush · v1.0
            </p>
          </nav>
        </div>
      </aside>
      <PeopleDiscovery open={peopleOpen} onClose={() => setPeopleOpen(false)} />
    </>
  );
}

function Group({
  label,
  note,
  index = 0,
  open,
  variant = "glass",
  children,
}: {
  label: string;
  note?: string;
  index?: number;
  open: boolean;
  variant?: "glass" | "solid";
  children: React.ReactNode;
}) {
  const cardClass =
    variant === "solid"
      ? "overflow-hidden rounded-[24px] bg-[#162032] shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)]"
      : "overflow-hidden rounded-[26px] border border-border/60 bg-card/70 shadow-[0_18px_40px_-24px_rgba(80,20,60,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl";

  return (
    <section
      className={`mt-5 first:mt-1 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: open ? `${120 + index * 90}ms` : "0ms" }}
    >
      <div className="mb-2 flex items-end justify-between px-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">
          {label}
        </h3>
        {note ? (
          <span className="rounded-full bg-card/70 px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm ring-1 ring-border/60">
            {note}
          </span>
        ) : null}
      </div>
      <div className={cardClass}>{children}</div>
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
  variant = "glass",
}: {
  label: string;
  to: string;
  icon: IconType;
  tint: string;
  hint?: string;
  badge?: string;
  params?: Record<string, string>;
  onNavigate?: () => void;
  variant?: "glass" | "solid";
}) {
  const isSolid = variant === "solid";
  return (
    <Link
      to={to as any}
      params={params as any}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3.5 px-4 py-3 transition-colors duration-300 ${
        isSolid
          ? "border-b border-white/5 hover:bg-white/5 active:bg-white/8 last:border-b-0"
          : "border-b border-border/50 hover:bg-primary/10 active:bg-primary/15 last:border-b-0"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-white transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-active:scale-95 ${
          isSolid ? "" : "ring-1 ring-white/50"
        }`}
        style={{
          background: isSolid ? tint : `linear-gradient(135deg, ${shade(tint, 18)}, ${shade(tint, -18)})`,
          boxShadow: isSolid ? "none" : `0 10px 20px -10px ${tint}, inset 0 1px 0 rgba(255,255,255,0.55)`,
        }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.35} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-bold leading-tight tracking-[-0.01em] ${isSolid ? "text-white" : "text-foreground"}`}>
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {badge ? (
        <span className="rounded-full bg-gradient-brand px-2.5 py-[4px] text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-[0_6px_14px_-6px_rgba(255,45,117,0.9)]">
          {badge}
        </span>
      ) : null}
      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${isSolid ? "text-white/30 group-hover:text-white/70" : "text-muted-foreground/50 group-hover:text-primary"}`} />
    </Link>
  );
}

// Tiny helper to lighten/darken a hex color for the icon-tile gradient endpoints.
function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const f = percent / 100;
  r = Math.max(0, Math.min(255, Math.round(r + (percent > 0 ? (255 - r) * f : r * f))));
  g = Math.max(0, Math.min(255, Math.round(g + (percent > 0 ? (255 - g) * f : g * f))));
  b = Math.max(0, Math.min(255, Math.round(b + (percent > 0 ? (255 - b) * f : b * f))));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
