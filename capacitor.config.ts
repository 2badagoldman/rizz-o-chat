import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Crush native shell (iOS + Android).
 *
 * The web app is server-rendered (TanStack Start + server functions), so the
 * native shell loads the live production site instead of a static bundle.
 * That means every web deploy instantly updates the installed apps — no
 * store resubmission needed for content/UI changes.
 *
 * To test against a local dev server, set CAP_SERVER_URL before `cap sync`.
 */
const serverUrl = process.env.CAP_SERVER_URL ?? "https://rizzlachat.com";

const config: CapacitorConfig = {
  appId: "com.kolotechnology.crush",
  appName: "Crush",
  // Only used as a fallback shell; the app loads `server.url`.
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
    // Keep OAuth / Stripe redirects inside the app webview.
    allowNavigation: [
      "rizzlachat.com",
      "*.rizzlachat.com",
      "*.lovable.app",
      "*.supabase.co",
      "checkout.stripe.com",
      "js.stripe.com",
      "accounts.google.com",
    ],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0B0B12",
  },
  android: {
    backgroundColor: "#0B0B12",
    allowMixedContent: false,
  },
  plugins: {
    Keyboard: { resize: "native" },
    StatusBar: { style: "DARK", backgroundColor: "#0B0B12" },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },

};

export default config;
