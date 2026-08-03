import { useEffect, useState } from "react";
import { Download, Share, X, Plus } from "lucide-react";
import crushLogo from "@/assets/rizz-ai-logo.webp.asset.json";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "crush.install_prompt_dismissed";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/**
 * Direct-to-phone install banner. Uses the native Chrome/Edge/Android install
 * prompt when the browser offers one, and falls back to Add-to-Home-Screen
 * instructions on iOS Safari — so members can install Crush today without
 * waiting on App Store / Play review.
 */
export function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || recentlyDismissed()) return;
    // Inside the Capacitor native shell there is nothing to install.
    if ((window as unknown as { Capacitor?: unknown }).Capacitor) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      t = setTimeout(() => {
        setShowIos(true);
        setOpen(true);
      }, 3500);
    } else {
      // Browsers that never fire beforeinstallprompt (desktop Safari, Firefox)
      // still get manual add-to-home-screen guidance.
      t = setTimeout(() => {
        setDeferred((d) => {
          if (!d) {
            setShowIos(true);
            setOpen(true);
          }
          return d;
        });
      }, 8000);
    }

    const onInstalled = () => setHidden(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  if (hidden || !open) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setHidden(true);
    else dismiss();
    setDeferred(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
      <div className="pointer-events-auto w-full max-w-[480px] rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-pop backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <img
            src={crushLogo.url}
            alt="Crush app icon"
            loading="lazy"
            decoding="async"
            className="h-11 w-11 shrink-0 rounded-2xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-tight">Install Crush on your phone</p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              {showIos && !deferred
                ? "Tap Share, then Add to Home Screen — Crush opens full screen, no store needed."
                : "Add it to your home screen for full-screen chats and faster loading. No app store required."}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              {showIos && !deferred
                ? isIos()
                  ? "Tap Share, then Add to Home Screen — Crush opens full screen, no store needed."
                  : "Use your browser menu, then Install / Add to Home Screen — no app store required."
                : "Add it to your home screen for full-screen chats and faster loading. No app store required."}
            </p>
            {showIos && !deferred ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] font-semibold">
                <Share className="h-3.5 w-3.5" /> {isIos() ? "Share" : "Menu"}
                <span className="text-muted-foreground">then</span>
                <Plus className="h-3.5 w-3.5" /> {isIos() ? "Add to Home Screen" : "Install app"}
              </p>
            ) : (
              <button type="button" onClick={install} className="btn-brand mt-3 inline-flex items-center gap-1.5">
                <Download className="h-4 w-4" /> Install app
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
