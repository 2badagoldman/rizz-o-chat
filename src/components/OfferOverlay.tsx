import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import crushLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { useAuth } from "@/lib/auth";
import { useGoldAccess } from "@/hooks/useGoldAccess";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useIosBillingRestricted } from "@/hooks/useNative";

const SNOOZE_KEY = "crush:offerSnoozeUntil";
const SNOOZE_MS = 24 * 60 * 60 * 1000;
const IDLE_TRIGGER_MS = 40_000;

export const OFFER_EVENT = "crush:show-offer";

/** Anywhere in the app can pop the deal: window.dispatchEvent(new Event(OFFER_EVENT)) */
export function showCrushOffer() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OFFER_EVENT));
}

type Stage = null | "intro" | "final";

const OFFERS = {
  intro: {
    priceId: "crush_intro_monthly",
    badge: "One-time welcome deal",
    price: "$19.99",
    per: "for your first month",
    compare: "Normally $9.99/week — that's ~$43/month",
    title: "Stay and save 54%",
    cta: "Claim $19.99 deal",
    perks: [
      "Unlock every Friends List",
      "Unlimited chat with hosts and members",
      "AI copilot replies, no daily cap",
    ],
  },
  final: {
    priceId: "crush_last_chance_monthly",
    badge: "Final offer — expires when you close",
    price: "$9.99",
    per: "for your first month",
    compare: "That's one week's price for a whole month",
    title: "Last chance before you go",
    cta: "Claim $9.99 deal",
    perks: [
      "Everything in Crush Gold",
      "Cancel anytime in one tap",
      "Instant access the moment you pay",
    ],
  },
} as const;

export function OfferOverlay() {
  const { user } = useAuth();
  const { hasGold, loading } = useGoldAccess();
  const iosRestricted = useIosBillingRestricted();
  const { openCheckout, checkoutElement, isOpen: checkoutOpen } = useStripeCheckout();
  const [stage, setStage] = useState<Stage>(null);
  const shownRef = useRef(false);

  // QA escape hatch: window.__crushForceOffer = true previews the flow on any account.
  const forced =
    typeof window !== "undefined" && Boolean((window as unknown as { __crushForceOffer?: boolean }).__crushForceOffer);
  const eligible = forced || (Boolean(user) && !loading && !hasGold && !iosRestricted);

  const snoozed = useCallback(() => {
    try {
      const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
      return Date.now() < until;
    } catch {
      return false;
    }
  }, []);

  const open = useCallback(() => {
    if (!eligible || shownRef.current || snoozed()) return;
    shownRef.current = true;
    setStage("intro");
  }, [eligible, snoozed]);

  // Manual trigger from paywalls elsewhere in the app.
  useEffect(() => {
    const handler = () => {
      // Explicit triggers (paywalls, QA) always show — callers already know the
      // member needs the deal.
      shownRef.current = true;
      setStage("intro");
    };
    window.addEventListener(OFFER_EVENT, handler);
    return () => window.removeEventListener(OFFER_EVENT, handler);
  }, [open]);

  // Time-on-site + exit-intent triggers.
  useEffect(() => {
    if (!eligible) return;
    const t = setTimeout(open, IDLE_TRIGGER_MS);
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 2) open();
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [eligible, open]);

  const dismiss = () => {
    if (stage === "intro") {
      setStage("final");
      return;
    }
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* storage unavailable */
    }
    setStage(null);
  };

  if (!stage || typeof document === "undefined") return checkoutElement;

  const offer = OFFERS[stage];

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      data-testid={`offer-${stage}`}
      className={`fixed inset-0 z-[190] flex items-end justify-center bg-background/85 p-4 backdrop-blur-xl sm:items-center ${
        checkoutOpen ? "pointer-events-none opacity-0" : "overlay-in"
      }`}
    >
      <div className="sheet-in relative w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border border-primary/40 bg-card/95 p-5 shadow-pop">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl glow-breathe"
        />
        <button
          onClick={dismiss}
          data-testid="offer-dismiss"
          aria-label="Close offer"
          className="press-spring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card/80"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">
          <img src={crushLogo.url} alt="" aria-hidden className="h-3.5 w-3.5 rounded-full object-cover" /> {offer.badge}
        </span>

        <h2 className="relative mt-3 text-[1.6rem] font-black leading-tight">{offer.title}</h2>
        <p className="relative mt-1 text-sm text-muted-foreground">{offer.compare}</p>

        <div className="relative mt-4 flex items-end gap-2">
          <span className="text-4xl font-black text-emerald-500">{offer.price}</span>
          <span className="pb-1 text-sm text-muted-foreground">{offer.per}</span>
        </div>


        <ul className="relative mt-4 space-y-2">
          {offer.perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <button
          data-testid="offer-cta"
          onClick={() =>
            openCheckout(
              { kind: "catalog", priceId: offer.priceId },
              { title: "Crush Gold", subtitle: `${offer.price} first month, then monthly` },
            )
          }
          className="press-spring mt-5 w-full justify-center rounded-full bg-emerald-500 py-3 text-sm font-bold text-white shadow-pop transition-colors hover:bg-emerald-600"
        >
          {offer.cta}
        </button>

        <button
          onClick={dismiss}
          className="mt-2 w-full py-2 text-[12px] font-semibold text-muted-foreground"
        >
          {stage === "intro" ? "No thanks, maybe later" : "Close"}
        </button>
        <p className="relative mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
          Renews monthly after the first month. Cancel anytime from My subscriptions.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(overlay, document.body)}
      {checkoutElement}
    </>
  );
}
