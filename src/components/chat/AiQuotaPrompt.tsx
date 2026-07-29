import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

/** Shown when a member burns through their free AI replies. */
export function AiQuotaPrompt({
  limit,
  compact,
  who = "Crush AI",
}: {
  limit: number;
  compact?: boolean;
  who?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-primary/40 bg-primary/10 backdrop-blur ${
        compact ? "px-3 py-2.5" : "px-4 py-3.5"
      }`}
    >
      <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        You&apos;ve used your {limit} free replies
      </p>
      <p className="mt-1 text-[11.5px] font-semibold text-muted-foreground">
        Subscribe to Crush Gold to keep chatting with {who} — unlimited replies, no waiting.
      </p>
      <Link
        to="/upgrade"
        className="mt-2.5 inline-flex rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-glow transition active:scale-95"
        style={{ background: "var(--gradient-brand)" }}
      >
        Subscribe to continue
      </Link>
    </div>
  );
}
