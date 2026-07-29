import { useEffect, useState } from "react";
import { isNativeApp, nativePlatform } from "@/lib/native";

/**
 * Hydration-safe native platform detection.
 * Always returns "web" on the server and on the first client render, then
 * settles to the real platform after hydration.
 */
export function useNativePlatform(): "ios" | "android" | "web" {
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web");
  useEffect(() => {
    setPlatform(isNativeApp() ? nativePlatform() : "web");
  }, []);
  return platform;
}

/**
 * True when external (Stripe) purchase entry points must be hidden in a store
 * build.
 *
 * - iOS: always restricted — Apple requires in-app purchase for digital goods
 *   (App Store Review Guideline 3.1.1).
 * - Android: Google Play allows external payments for person-to-person
 *   services, so purchases stay visible by default. If Play review classifies
 *   coins as digital goods, set `VITE_ANDROID_BILLING_RESTRICTED=true` at build
 *   time to hide the same CTAs in the Android build — no code change needed.
 *
 * Web behaviour is never affected.
 */
export function useIosBillingRestricted(): boolean {
  const platform = useNativePlatform();
  if (platform === "ios") return true;
  if (platform === "android") {
    return import.meta.env.VITE_ANDROID_BILLING_RESTRICTED === "true";
  }
  return false;
}
