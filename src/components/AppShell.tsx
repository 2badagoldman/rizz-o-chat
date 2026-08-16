import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { Menu, Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { RizzBrainDock } from "./RizzBrainDock";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { ThemeToggle } from "./ThemeToggle";
import { SideDrawer } from "./SideDrawer";
import { GlobalSearch } from "./GlobalSearch";
import { LegalFooter } from "./LegalFooter";
import { OfferOverlay } from "./OfferOverlay";
import { LiveHostAlerts } from "./LiveHostAlerts";
import { DemoChatProofs } from "./DemoChatProofs";
import { InAppNotification } from "./InAppNotification";


import { PageAtmosphere } from "./PageAtmosphere";
import { PrismLayer } from "./Prism";
import { useIosBillingRestricted } from "@/hooks/useNative";
import { useIsAdmin } from "@/hooks/useIsAdmin";



import rizzAiLogo from "@/assets/crush-logo.png.asset.json";
import { initScrollReveal, initAnimScopes } from "@/lib/scroll-reveal";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
  hideDock?: boolean;
  hideFooter?: boolean;
  theme?: "member" | "host";
  footerNote?: ReactNode;
}

let forwardAvailable = false;

export function AppShell({ children, hideNav, hideDock, hideFooter, theme = "member", footerNote }: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Conversation surfaces own the bottom of the screen with a sticky composer,
  // so nothing else may float there.
  const isConversation =
    pathname.startsWith("/chat/") || /^\/rooms\/[^/]+$/.test(pathname) || pathname === "/copilot";
  const suppressDock = hideNav || hideDock || isConversation || pathname === "/auth";
  const suppressFooter = hideFooter || isConversation;
  // Selling runway sits at the top of every public surface.
  const showRunway =
    !isConversation &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/legal") &&
    !pathname.startsWith("/host/") &&
    pathname !== "/dashboard";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  // Module-scoped so the forward affordance survives the shell remounting on
  // every route change.
  const [canForward, setCanForward] = useState(forwardAvailable);
  const iosRestricted = useIosBillingRestricted();
  const { isAdmin } = useIsAdmin();


  // Browser-style back/forward inside the app shell (native shells have no chrome).
  useEffect(() => {
    setCanForward(false);
  }, [pathname]);


  useEffect(() => {
    initScrollReveal();
    initAnimScopes();
  }, [pathname]);


  return (
    <div className={`relative min-h-screen text-foreground ${theme === "host" ? "host-theme" : ""}`}>
      <PageAtmosphere />
      <header className="prism-surface sticky top-0 z-30 overflow-hidden border-b border-border/50 bg-background/55 backdrop-blur-2xl">
        <PrismLayer ring={false} sparkles caustics sheen={false} className="opacity-60" />
        <div className="relative z-10">
        <PaymentTestModeBanner />

        {/* Thin animated gradient hairline */}
        <div
          aria-hidden
          className="prism-shift h-[3px] w-full bg-gradient-brand"
          style={{ backgroundSize: "260% 100%" }}
        />
        <div className="mx-auto grid w-full max-w-[480px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 md:max-w-[680px] lg:max-w-[820px]">

          <div className="flex min-w-0 items-center gap-1">
            <button
              onClick={() => {
                forwardAvailable = true;
                setCanForward(true);
                router.history.back();
              }}
              className="press-spring shrink-0 rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
              aria-label="Go back"
              data-testid="nav-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                forwardAvailable = false;
                setCanForward(false);
                router.history.forward();
              }}
              disabled={!canForward}
              className="press-spring shrink-0 rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-30"
              aria-label="Go forward"
              data-testid="nav-forward"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.assign("/");
              }}
              className="flex min-w-0 items-center gap-2"
              aria-label="Crush home — reload"
            >
              <span className="ring-story inline-block shrink-0">
                <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="Crush" className="block h-8 w-8 rounded-full bg-card" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="whitespace-nowrap font-display text-sm font-bold tracking-tight">Crush</span>
                <span className="hidden whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground xs:block sm:block">
                  Friends Always
                </span>
              </span>
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isAdmin ? (
              <Link
                to="/admin"
                className="press-spring shrink-0 rounded-full border border-border/70 bg-card/60 p-1.5 text-foreground backdrop-blur-xl hover:bg-primary/10"
                aria-label="Admin portal"
                title="Admin portal"
              >
                <Shield className="h-4 w-4" />
              </Link>
            ) : null}
            <button
              onClick={() => setSearchOpen(true)}
              className="press-spring shrink-0 rounded-full border border-border/70 bg-card/60 p-1.5 text-foreground backdrop-blur-xl hover:bg-primary/10"
              aria-label="Search creators"
            >
              <Search className="h-4 w-4" />
            </button>
            <ThemeToggle />

            {!iosRestricted ? (
              <>
                <Link
                  to="/coins"
                  className="press-spring hidden shrink-0 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur-xl hover:bg-primary/10 sm:inline-flex"
                >
                  Coins
                </Link>
                <Link
                  to="/upgrade"
                  className="press-spring btn-brand shrink-0 !py-1 !px-3 text-[11px] hover:btn-brand-hover"
                >
                  Upgrade
                </Link>
              </>
            ) : null}
          </div>
        </div>
        </div>
      </header>

      <main
        key={pathname}
        className="page-anim lux-scroll relative z-10 mx-auto w-full max-w-[480px] px-4 pt-4 md:max-w-[680px] md:px-6 lg:max-w-[820px]"
        style={{
          paddingBottom: hideNav
            ? "calc(env(safe-area-inset-bottom) + 2rem)"
            : "calc(env(safe-area-inset-bottom) + 11rem)",
        }}
      >
        {showRunway ? (
          <DemoChatProofs
            variant="rail"
            limit={20}
            title="Real chats with real creators"
            showCta={false}
            lineLimit={1}
          />
        ) : null}
        {children}
        {footerNote ? (
          <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        ) : null}
        {!suppressFooter ? <LegalFooter /> : null}

      </main>

      {!suppressDock ? <RizzBrainDock /> : null}
      {!hideNav ? <BottomNav /> : null}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <OfferOverlay />
      <LiveHostAlerts />
      
      <InAppNotification />


      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
