import { useEffect } from "react";
import { toast } from "sonner";
import crushLogo from "@/assets/crush-logo.png.asset.json";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "crush.install_prompt_dismissed";
const DISMISS_DAYS = 7;
const TOAST_ID = "crush-install";

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

function snooze() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

/**
 * Install Crush as a lightweight toast notification (never an in-app sticker
 * that covers content). Uses the native Chrome/Edge/Android install prompt when
 * available and falls back to Add-to-Home-Screen guidance elsewhere.
 */
export function InstallAppPrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || recentlyDismissed()) return;
    if ((window as unknown as { Capacitor?: unknown }).Capacitor) return;

    let deferred: BeforeInstallPromptEvent | null = null;
    let shown = false;

    const icon = (
      <img src={crushLogo.url} alt="" className="h-8 w-8 rounded-xl" loading="lazy" decoding="async" />
    );

    const showNative = () => {
      if (shown) return;
      shown = true;
      toast("Install Crush on your phone", {
        id: TOAST_ID,
        description: "Full-screen chats, faster loading. No app store required.",
        icon,
        duration: 15000,
        onDismiss: snooze,
        action: {
          label: "Install",
          onClick: async () => {
            if (!deferred) return;
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome !== "accepted") snooze();
            deferred = null;
          },
        },
      });
    };

    const showManual = () => {
      if (shown) return;
      shown = true;
      toast("Add Crush to your home screen", {
        id: TOAST_ID,
        description: isIos()
          ? "Tap Share, then Add to Home Screen — no app store needed."
          : "Open your browser menu, then Install / Add to Home Screen.",
        icon,
        duration: 15000,
        onDismiss: snooze,
      });
    };

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      showNative();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const t = setTimeout(() => {
      if (!deferred) showManual();
    }, isIos() ? 4000 : 8000);

    const onInstalled = () => toast.dismiss(TOAST_ID);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, []);

  return null;
}
