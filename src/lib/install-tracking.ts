// Tracks app install funnel signals into analytics_events so the admin
// dashboard can compare installs against paid conversions.
import { track } from "@/lib/analytics";
import { getRefCode } from "@/lib/ref-code";

const ONCE_KEY = "rizzla:install_tracked";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mm || iosStandalone;
}

function platform(): string {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "web";
}

export function startInstallTracking() {
  if (typeof window === "undefined") return;

  // Native/PWA shell open — counted once per install per browser profile.
  if (isStandalone()) {
    track("app_open_standalone", { metadata: { platform: platform() } });
    if (!localStorage.getItem(ONCE_KEY)) {
      localStorage.setItem(ONCE_KEY, String(Date.now()));
      track("app_install", { metadata: { platform: platform(), source: "standalone_first_open", ref: getRefCode() } });
    }
  }

  window.addEventListener("beforeinstallprompt", () => {
    track("install_prompt", { metadata: { platform: platform() } });
  });

  window.addEventListener("appinstalled", () => {
    localStorage.setItem(ONCE_KEY, String(Date.now()));
    track("app_install", { metadata: { platform: platform(), source: "appinstalled", ref: getRefCode() } });
  });
}
