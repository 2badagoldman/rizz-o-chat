import { useEffect } from "react";
import crushLogo from "@/assets/crush-logo.png.asset.json";
import { invalidateIdentityImage } from "@/lib/showcase-avatar-store";
import { localHostPortrait } from "@/lib/host-avatars";

/**
 * Global safety net: no broken image icon or raw alt text is ever visible.
 * `error` doesn't bubble, so we listen in the capture phase on the document.
 *
 * Order of repair for a failed <img>:
 *  1. If the URL is a creator's registered photo (expired signed link,
 *     offline…), forget that photo app-wide and swap in her bundled portrait —
 *     the card keeps showing the right person.
 *  2. Otherwise fall back to the brand placeholder.
 * Videos that fail to load are hidden (a poster-less black box reads as broken).
 */
export function ImageGuard() {
  useEffect(() => {
    const attempts = new WeakMap<HTMLImageElement, number>();

    const absolute = (url: string) => {
      try {
        return new URL(url, window.location.href).href;
      } catch {
        return url;
      }
    };

    const fix = (el: HTMLImageElement) => {
      const n = attempts.get(el) ?? 0;
      attempts.set(el, n + 1);
      if (n >= 2) return;

      if (n === 0) {
        const raw = el.getAttribute("src") ?? "";
        const hostId = invalidateIdentityImage(raw) ?? invalidateIdentityImage(el.src);
        const local = hostId ? localHostPortrait(hostId) : "";
        if (local && absolute(local) !== el.src) {
          el.src = local;
          return;
        }
      }

      el.dataset["broken"] = "true";
      // Alt text is what makes a failed image look "broken" on screen.
      if (el.alt) {
        el.setAttribute("aria-label", el.alt);
        el.alt = "";
      }
      el.classList.remove("opacity-0");
      if (el.src !== crushLogo.url) el.src = crushLogo.url;
    };

    const onError = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t instanceof HTMLImageElement) fix(t);
      else if (t instanceof HTMLVideoElement) t.style.visibility = "hidden";
    };

    document.addEventListener("error", onError, true);

    // Catch images that already failed before this mounted (SSR markup).
    const sweep = () => {
      document.querySelectorAll("img").forEach((img) => {
        if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fix(img);
      });
    };
    sweep();
    const t = setTimeout(sweep, 1500);

    return () => {
      document.removeEventListener("error", onError, true);
      clearTimeout(t);
    };
  }, []);

  return null;
}
