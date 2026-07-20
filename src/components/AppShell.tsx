import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { RizzBrainDock } from "./RizzBrainDock";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

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
  const hideHeader = pathname === "/auth";
  return (
    <div className={`min-h-screen bg-background text-foreground ${theme === "host" ? "host-theme" : ""}`}>
      {!hideHeader ? (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[480px] items-center justify-between px-4 py-2.5">
            <Link to="/" className="flex items-center gap-2" aria-label="Rizzla home">
              <img src={rizzAiLogo.url} alt="Rizzla" className="h-8 w-8 rounded-full" />
              <span className="text-sm font-semibold tracking-tight">Rizzla</span>
            </Link>
          </div>
        </header>
      ) : null}
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
