import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import crushLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { useAuth } from "@/lib/auth";
import { useGoldAccess } from "@/hooks/useGoldAccess";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useIosBillingRestricted } from "@/hooks/useNative";

const SNOOZE_KEY = "crush:offerSnoozeUntil";
const SESSION_COUNT_KEY = "crush:offerSessionCount";
const LAST_SESSION_KEY = "crush:offerLastSession";
const SNOOZE_MS = 24 * 60 * 60 * 1000; // 24h after a user dismisses the final offer
const IDLE_TRIGGER_MS = 90_000; // 90s before auto-trigger
const MIN_TIME_ON_SITE_MS = 20_000; // at least 20s on the page before any offer
const MAX_PER_SESSION = 1; // one auto/exit-intent offer per session
const MAX_PER_DAY = 3; // hard daily ceiling across sessions

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
      "Unlimited chat with creators and members",
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Pages where an upsell would interrupt something important.
  const quietRoute =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/rooms/") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/admin");
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

  const sessionCounts = useCallback(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastSession = localStorage.getItem(LAST_SESSION_KEY) ?? today;
      let count = Number(localStorage.getItem(SESSION_COUNT_KEY) ?? 0);
      if (lastSession !== today) count = 0;
      return { today, count };
    } catch {
      return { today: "", count: 0 };
    }
  }, []);

  const underDailyCap = useCallback(() => {
    const { count } = sessionCounts();
    return count < MAX_PER_DAY;
  }, [sessionCounts]);

  const bumpSessionCount = useCallback(() => {
    try {
      const { today, count } = sessionCounts();
      localStorage.setItem(LAST_SESSION_KEY, today);
      localStorage.setItem(SESSION_COUNT_KEY, String(count + 1));
    } catch {
      /* storage unavailable */
    }
  }, [sessionCounts]);

  const open = useCallback(
    (source: "idle" | "exit" | "manual") => {
      if (!eligible) return;
      if (source !== "manual") {
        if (shownRef.current) return; // already shown this session
        if (snoozed()) return; // user dismissed final offer recently
        if (!underDailyCap()) return; // daily ceiling hit
      }
      shownRef.current = true;
      bumpSessionCount();
      setStage("intro");
    },
    [eligible, snoozed, underDailyCap, bumpSessionCount],
  );

  // Manual trigger from paywalls elsewhere in the app.
  useEffect(() => {
    const handler = () => open("manual");
    window.addEventListener(OFFER_EVENT, handler);
    return () => window.removeEventListener(OFFER_EVENT, handler);
  }, [open]);

  // Time-on-site + exit-intent triggers.
  // Never interrupt an active conversation, checkout, or age verification.
  useEffect(() => {
    if (!eligible || quietRoute) return;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 2) open("exit");
    };
    const minTimer = setTimeout(() => {
      idleTimer = setTimeout(() => open("idle"), IDLE_TRIGGER_MS);
      document.addEventListener("mouseout", onLeave);
    }, MIN_TIME_ON_SITE_MS);
    return () => {
      clearTimeout(minTimer);
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [eligible, open, quietRoute]);

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

        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <img src={crushLogo.url} alt="" aria-hidden className="h-3.5 w-3.5 rounded-full object-cover" /> {offer.badge}
        </span>

        <h2 className="relative mt-3 text-[1.6rem] font-black leading-tight">{offer.title}</h2>
        <p className="relative mt-1 text-sm text-muted-foreground">{offer.compare}</p>

        <div className="relative mt-4 flex items-end gap-2">
          <span className="text-4xl font-black text-primary">{offer.price}</span>
          <span className="pb-1 text-sm text-muted-foreground">{offer.per}</span>
        </div>


        <ul className="relative mt-4 space-y-2">
          {offer.perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
          style={{ background: "var(--gradient-brand)" }}
          className="press-spring mt-5 w-full justify-center rounded-full py-3 text-sm font-bold text-primary-foreground shadow-pop transition-opacity hover:opacity-90"
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
