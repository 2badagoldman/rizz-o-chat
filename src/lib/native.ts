// Native (Capacitor) runtime helpers.
// Every function is a safe no-op in the browser, so the deployed web app is
// completely unaffected by this file.

let nativeChecked = false;
let nativeCached = false;

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  if (nativeChecked) return nativeCached;
  nativeChecked = true;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  nativeCached = Boolean(cap?.isNativePlatform?.());
  return nativeCached;
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
}

/** Initialise native chrome: status bar, keyboard behaviour, hardware back button. */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0B0B12" });
    }
  } catch {
    /* noop */
  }

  try {
    const { App } = await import("@capacitor/app");
    await App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void App.exitApp();
    });
  } catch {
    /* noop */
  }

  try {
    document.documentElement.classList.add("is-native", `is-${nativePlatform()}`);
  } catch {
    /* noop */
  }
}

/** Light haptic tap — silently ignored on web. */
export async function tapHaptic(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* noop */
  }
}
