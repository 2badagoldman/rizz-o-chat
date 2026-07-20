import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { RizzBrainDock } from "./RizzBrainDock";

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
  return (
    <div className={`min-h-screen bg-background text-foreground ${theme === "host" ? "host-theme" : ""}`}>
      <main className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-32">
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
