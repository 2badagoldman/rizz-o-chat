import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Clock, Lock } from "lucide-react";
import { useKyc } from "@/hooks/useKyc";

const EXEMPT_PREFIXES = ["/verify", "/auth", "/legal", "/admin", "/soon"];

/**
 * Age-verification (KYC) surface.
 * - Soft banner counting down the 7-day window while a member is unverified.
 * - Hard blocking sheet once the deadline passes without approval.
 */
export function KycGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { status, locked, daysLeft, hoursLeft, loading } = useKyc();

  const exempt = EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (loading || status === "approved") return null;

  if (locked && !exempt) {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-background/85 p-5 backdrop-blur-xl">
        <div className="w-full max-w-sm rounded-[24px] border border-border bg-card/95 p-6 text-center shadow-glow animate-scale-in">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15">
            <Lock className="h-7 w-7 text-destructive" />
          </span>
          <h2 className="mt-4 text-xl">Age check required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your 7-day grace period has ended. Rizzla is strictly 18+, so your account stays
            paused until we confirm your age. It takes about a minute.
          </p>
          <Link to="/verify" className="btn-brand mt-5 inline-flex w-full justify-center">
            Verify my age
          </Link>
          <Link
            to="/legal/terms"
            className="mt-3 inline-block text-[11px] text-muted-foreground underline"
          >
            Why we ask for this
          </Link>
        </div>
      </div>
    );
  }

  if (exempt) return null;

  const tone =
    status === "rejected"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : status === "pending"
        ? "border-border bg-card/80 text-muted-foreground"
        : "border-primary/30 bg-primary/10 text-foreground";

  const Icon = status === "rejected" ? ShieldAlert : status === "pending" ? ShieldCheck : Clock;

  const label =
    status === "pending"
      ? "Age check in review — usually under 24 hours."
      : status === "rejected"
        ? "Age check needs another try. Re-upload to keep your account."
        : daysLeft > 0
          ? `Verify your age within ${daysLeft} ${daysLeft === 1 ? "day" : "days"} to keep your account.`
          : `Verify your age within ${Math.max(1, hoursLeft)}h to keep your account.`;

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-[16px] border px-3.5 py-2.5 text-[12px] ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 leading-snug">{label}</span>
      {status !== "pending" ? (
        <Link
          to="/verify"
          className="shrink-0 rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-semibold text-primary-foreground"
        >
          Verify
        </Link>
      ) : null}
    </div>
  );
}
