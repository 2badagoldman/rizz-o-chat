import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { RizzBrainDock } from "./RizzBrainDock";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { initScrollReveal } from "@/lib/scroll-reveal";

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

  useEffect(() => {
    initScrollReveal();
  }, [pathname]);

  return (
    <div className={`min-h-screen text-foreground ${theme === "host" ? "host-theme" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <PaymentTestModeBanner />
        {/* Thin animated gradient hairline */}
        <div
          aria-hidden
          className="h-[3px] w-full bg-gradient-brand"
          style={{ backgroundSize: "200% 100%", animation: "gradient-pan 6s ease-in-out infinite" }}
        />
        <div className="mx-auto flex w-full max-w-[480px] items-center justify-between px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2" aria-label="Rizzla home">
            <span className="ring-story inline-block">
              <img src={rizzAiLogo.url} alt="Rizzla" className="block h-8 w-8 rounded-full bg-card" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-bold tracking-tight">Rizzla</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Friends Always
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/coins"
              className="rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold text-foreground transition-transform hover:scale-105 hover:bg-primary/10"
            >
              Coins
            </Link>
            <Link
              to="/upgrade"
              className="btn-brand !py-1 !px-3 text-[11px] hover:btn-brand-hover"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </header>
      <main key={pathname} className="page-anim mx-auto w-full max-w-[480px] px-4 pt-4 pb-32">
        {children}
        {footerNote ? (
          <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        ) : null}
      </main>
      {!suppressDock ? <RizzBrainDock /> : null}
      {!hideNav ? <BottomNav /> : null}
    </div>
  );
}
