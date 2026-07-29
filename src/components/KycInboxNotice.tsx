import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { useKyc } from "@/hooks/useKyc";

/**
 * Age-verification notice delivered as an inbox message instead of a
 * site-wide banner. It only appears once the 7-day grace period ends, then
 * repeats as a weekly reminder for three weeks. After that the account is
 * flagged for an admin standing review.
 */
export function KycInboxNotice() {
  const { status, dueAt, loading } = useKyc();
  if (loading || status === "approved") return null;
  if (!dueAt) return null;

  const msPast = Date.now() - new Date(dueAt).getTime();
  if (msPast <= 0) return null; // still inside the first week — stay quiet

  const week = Math.min(4, Math.floor(msPast / (7 * 86_400_000)) + 1);
  const underReview = week > 3;

  const Icon = status === "rejected" ? ShieldAlert : status === "pending" ? ShieldCheck : Clock;

  const body =
    status === "pending"
      ? "Thanks — your age check is in review. We'll confirm here, usually within 24 hours."
      : underReview
        ? "We sent three weekly reminders and haven't been able to confirm your age. Your account standing is now with our trust team. Verifying now still resolves it."
        : status === "rejected"
          ? "Your last age check couldn't be verified. Re-upload a clearer photo of your ID to keep full access."
          : `Reminder ${week} of 3 — Crush is strictly 18+. Confirm your age to keep your account in good standing. It takes about a minute.`;

  return (
    <section className="mt-4 flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-brand text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Crush Trust &amp; Safety</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
        {status !== "pending" ? (
          <Link
            to="/verify"
            className="mt-2 inline-flex rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-semibold text-primary-foreground"
          >
            Verify my age
          </Link>
        ) : null}
      </div>
    </section>
  );
}
