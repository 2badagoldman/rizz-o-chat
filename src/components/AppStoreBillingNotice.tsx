import { Sparkles } from "lucide-react";

/**
 * Shown instead of Stripe purchase buttons inside the iOS App Store build,
 * where Apple requires digital goods to use in-app purchase. Keeps the app
 * compliant with App Store Review Guideline 3.1.1 (no external purchase
 * links or calls to action inside the app).
 */
export function AppStoreBillingNotice({ what = "Memberships and coins" }: { what?: string }) {
  return (
    <div className="relative rounded-[1.5rem] border border-border/70 bg-card/70 p-5 text-sm backdrop-blur-xl">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" /> Membership
      </span>
      <h2 className="mt-3 text-lg font-black leading-tight">Manage your plan from your account</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        {what} aren&apos;t sold in this version of the app. Any plan or balance already on your
        account works here exactly the same — chats, Friends Lists, gifts and rooms all stay
        unlocked.
      </p>
    </div>
  );
}
