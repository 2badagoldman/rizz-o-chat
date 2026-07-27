import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";

/** Trial countdown / paywall notice shown above chat composers. */
export function ChatTrialBanner({
  locked,
  onTrial,
  daysLeft,
}: {
  locked: boolean;
  onTrial: boolean;
  daysLeft: number;
}) {
  if (locked) {
    return (
      <div className="mb-2 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 backdrop-blur">
        <Lock className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-xs leading-snug">
          Your 7-day free chat trial has ended. Upgrade to <strong>Rizz Gold</strong> to keep chatting.
        </p>
        <Link to="/upgrade" className="btn-brand shrink-0 px-3 py-1.5 text-xs">
          Upgrade
        </Link>
      </div>
    );
  }
  if (onTrial) {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="flex-1">
          Free chat trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} left.
        </span>
        <Link to="/upgrade" className="font-semibold text-primary">
          Go Gold
        </Link>
      </div>
    );
  }
  return null;
}
