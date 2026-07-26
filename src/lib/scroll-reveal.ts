// Lightweight scroll reveal: toggles `.revealed` on any [data-reveal] element
// as it enters the viewport. Idempotent; safe to call from a route effect.
let observer: IntersectionObserver | null = null;
let mo: MutationObserver | null = null;

function ensureObserver() {
  if (typeof window === "undefined") return null;
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  return observer;
}

function scan() {
  const obs = ensureObserver();
  if (!obs) return;
  document
    .querySelectorAll<HTMLElement>("[data-reveal]:not(.revealed)")
    .forEach((el) => obs.observe(el));
}

export function initScrollReveal() {
  if (typeof window === "undefined") return () => {};
  scan();
  if (!mo) {
    mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
  }
  // Re-scan next frame in case content mounts after the effect.
  requestAnimationFrame(scan);
  return () => {
    /* leave observers alive for the session */
  };
}

/**
 * Pauses decorative animation scopes ([data-anim-scope]) while they are off
 * screen so aurora/prism/coin loops stop consuming GPU during long scrolls.
 */
let animObserver: IntersectionObserver | null = null;
let animMo: MutationObserver | null = null;

function scanAnimScopes() {
  if (typeof window === "undefined") return;
  if (!animObserver) {
    animObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("anim-off", !e.isIntersecting);
      },
      { rootMargin: "120px" },
    );
  }
  document
    .querySelectorAll<HTMLElement>("[data-anim-scope]")
    .forEach((el) => animObserver!.observe(el));
}

export function initAnimScopes() {
  if (typeof window === "undefined") return () => {};
  scanAnimScopes();
  if (!animMo) {
    animMo = new MutationObserver(() => scanAnimScopes());
    animMo.observe(document.body, { childList: true, subtree: true });
  }
  return () => {};
}
