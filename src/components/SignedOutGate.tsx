import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PrismEmptyState } from "@/components/Prism";

/**
 * Single, polished signed-out screen used by every gated route.
 * Replaces the ad-hoc "h1 + Sign in button" cards so spacing, typography and
 * the secondary "create account" path are identical everywhere.
 */
export function SignedOutGate({
  title,
  description = "Sign in to your Crush account to continue — it only takes a moment.",
  icon,
  cta = "Sign in",
  shell = true,
  theme,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  cta?: string;
  shell?: boolean;
  theme?: "host";
}) {
  const body = (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center py-10">
      <PrismEmptyState
        icon={icon ?? <LogIn className="h-6 w-6" />}
        title={title}
        description={description}
        action={
          <div className="mt-2 flex flex-col items-center gap-2">
            <Link
              to="/auth"
              className={`${theme === "host" ? "btn-host" : "btn-brand"} inline-flex min-w-[10rem] justify-center`}
            >
              {cta}
            </Link>
            <Link
              to="/auth"
              className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              New here? Create a free account
            </Link>
          </div>
        }
      />
    </div>
  );

  if (!shell) return body;
  return theme === "host" ? <AppShell theme="host">{body}</AppShell> : <AppShell>{body}</AppShell>;
}
