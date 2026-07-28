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

/* ---------------------------------------------------------------- camera */

/**
 * Native camera / photo library capture. Returns a File ready for upload, or
 * null when unavailable (web) or cancelled — callers fall back to <input file>.
 */
export async function captureNativePhoto(
  source: "camera" | "photos" = "camera",
): Promise<File | null> {
  if (!isNativeApp()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 82,
      allowEditing: false,
      correctOrientation: true,
      resultType: CameraResultType.Uri,
      source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    });
    const uri = photo.webPath ?? photo.path;
    if (!uri) return null;
    const blob = await (await fetch(uri)).blob();
    const ext = photo.format || "jpg";
    return new File([blob], `capture-${Date.now()}.${ext}`, {
      type: blob.type || `image/${ext}`,
    });
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- push */

export type PushPermission = "granted" | "denied" | "unsupported";

/**
 * Ask for push permission and register with APNs/FCM. `onToken` receives the
 * device token so the caller can persist it. No-op on web.
 */
export async function registerPushNotifications(
  onToken: (token: string, platform: "ios" | "android") => void | Promise<void>,
): Promise<PushPermission> {
  if (!isNativeApp()) return "unsupported";
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return "denied";

    await PushNotifications.addListener("registration", (token) => {
      const platform = nativePlatform();
      if (platform === "ios" || platform === "android") {
        void onToken(token.value, platform);
      }
    });
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = (action.notification.data as { link?: string } | undefined)?.link;
      if (link && typeof link === "string" && link.startsWith("/")) {
        window.location.assign(link);
      }
    });
    await PushNotifications.register();
    return "granted";
  } catch {
    return "unsupported";
  }
}
