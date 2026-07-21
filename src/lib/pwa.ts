// Guarded PWA service-worker registration wrapper.
// Rules (from Lovable PWA skill):
//  - Never register in dev, Lovable preview, iframes, or when ?sw=off is set
//  - On refused contexts, unregister any existing /sw.js registration
//  - Only registers the vite-plugin-pwa generated /sw.js in production
export async function registerPwa(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  const previewHost =
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev") ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--");
  const killSwitch = url.searchParams.get("sw") === "off";
  const refuse = !import.meta.env.PROD || inIframe || previewHost || killSwitch;

  if (refuse) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs
          .filter((r) => r.active?.scriptURL?.endsWith("/sw.js"))
          .map((r) => r.unregister()),
      );
    } catch {
      /* noop */
    }
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    /* noop */
  }
}
