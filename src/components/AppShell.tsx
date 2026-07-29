import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { RizzBrainDock } from "./RizzBrainDock";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { ThemeToggle } from "./ThemeToggle";
import { SideDrawer } from "./SideDrawer";
import { GlobalSearch } from "./GlobalSearch";
import { LegalFooter } from "./LegalFooter";

import { PageAtmosphere } from "./PageAtmosphere";
import { PrismLayer } from "./Prism";
import { useIosBillingRestricted } from "@/hooks/useNative";


import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { initScrollReveal, initAnimScopes } from "@/lib/scroll-reveal";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
  hideDock?: boolean;
  theme?: "member" | "host";
  footerNote?: ReactNode;
}

export function AppShell({ children, hideNav, hideDock, theme = "member", footerNote }: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const suppressDock = hideNav || hideDock || pathname === "/copilot" || pathname === "/auth";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const iosRestricted = useIosBillingRestricted();

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
        <div className="mx-auto flex w-full max-w-[480px] items-center justify-between px-4 py-2.5">

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-1.5 hover:bg-muted transition-colors"
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
              className="flex items-center gap-2"
              aria-label="Crush home — reload"
            >
              <span className="ring-story inline-block">
                <img src={rizzAiLogo.url} alt="Crush" className="block h-8 w-8 rounded-full bg-card" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-sm font-bold tracking-tight">Crush</span>
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Friends Always
                </span>
              </span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="press-spring rounded-full border border-border/70 bg-card/60 p-1.5 text-foreground backdrop-blur-xl hover:bg-primary/10"
              aria-label="Search hosts"
            >
              <Search className="h-4 w-4" />
            </button>
            <ThemeToggle />
            {!iosRestricted ? (
              <>
                <Link
                  to="/coins"
                  className="press-spring rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur-xl hover:bg-primary/10"
                >
                  Coins
                </Link>
                <Link
                  to="/upgrade"
                  className="press-spring btn-brand !py-1 !px-3 text-[11px] hover:btn-brand-hover"
                >
                  Upgrade
                </Link>
              </>
            ) : null}
          </div>
        </div>
        </div>
      </header>

      <main key={pathname} className="page-anim lux-scroll relative z-10 mx-auto w-full max-w-[480px] px-4 pt-4 pb-32">

        {children}
        {footerNote ? (
          <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        ) : null}
        <LegalFooter />

      </main>
      {!suppressDock ? <RizzBrainDock /> : null}
      {!hideNav ? <BottomNav /> : null}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
