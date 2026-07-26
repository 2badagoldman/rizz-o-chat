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
 * True inside the iOS App Store build. Apple requires in-app purchase for
 * digital goods, so external (Stripe) purchase entry points must be hidden
 * there — the same screens stay fully available on web and Android.
 */
export function useIosBillingRestricted(): boolean {
  return useNativePlatform() === "ios";
}
