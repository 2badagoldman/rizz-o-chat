import { useEffect } from "react";
import crushLogo from "@/assets/crush-logo.png.asset.json";

/**
 * Global safety net: no broken image icon or raw alt text is ever visible.
 * `error` doesn't bubble, so we listen in the capture phase on the document
 * and swap any failed <img> for the brand placeholder. Videos that fail to
 * load are hidden instead (a poster-less black box reads as broken).
 */
export function ImageGuard() {
  useEffect(() => {
    const seen = new WeakSet<HTMLImageElement>();

    const fix = (el: HTMLImageElement) => {
      if (seen.has(el)) return;
      seen.add(el);
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
