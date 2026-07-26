/**
 * Performance tier detection for the global glass/prism polish.
 *
 * Sets `data-perf="full" | "mid" | "lite"` on <html> so CSS can scale back
 * blur radii, animation counts and frame rates on mid-range devices, and
 * `data-anim-paused` while the tab is hidden so decorative loops stop
 * burning GPU in the background.
 *
 * Signals used (cheap, all synchronous except the frame probe):
 *  - prefers-reduced-motion / Save-Data  -> lite
 *  - navigator.deviceMemory              -> <= 4GB is mid, <= 2GB is lite
 *  - navigator.hardwareConcurrency       -> <= 4 cores is mid, <= 2 is lite
 *  - live rAF probe (~800ms)             -> demotes a tier if frames drop
 */

export type PerfTier = "full" | "mid" | "lite";

let current: PerfTier | null = null;
let started = false;
const listeners = new Set<(t: PerfTier) => void>();

const RANK: Record<PerfTier, number> = { full: 2, mid: 1, lite: 0 };

function nav() {
  return navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
}

function staticTier(): PerfTier {
  if (typeof window === "undefined") return "full";
  const n = nav();

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "lite";
  if (n.connection?.saveData) return "lite";

  const mem = n.deviceMemory;
  const cores = n.hardwareConcurrency;
  const effective = n.connection?.effectiveType;

  let tier: PerfTier = "full";
  const demote = (t: PerfTier) => {
    if (RANK[t] < RANK[tier]) tier = t;
  };

  if (typeof mem === "number") demote(mem <= 2 ? "lite" : mem <= 4 ? "mid" : "full");
  if (typeof cores === "number") demote(cores <= 2 ? "lite" : cores <= 4 ? "mid" : "full");
  if (effective === "slow-2g" || effective === "2g") demote("lite");
  // Small touch screens are usually phones: keep one tier of headroom.
  if (window.matchMedia?.("(pointer: coarse)").matches && window.innerWidth < 480) demote("mid");

  return tier;
}

function apply(tier: PerfTier) {
  if (current === tier) return;
  current = tier;
  document.documentElement.dataset.perf = tier;
  listeners.forEach((fn) => fn(tier));
}

/** Measures real frame pacing for ~800ms and demotes the tier if we drop frames. */
function probeFrames() {
  let frames = 0;
  let slow = 0;
  let last = performance.now();
  const start = last;

  const tick = (now: number) => {
    const dt = now - last;
    last = now;
    frames += 1;
    if (dt > 22) slow += 1; // slower than ~45fps
    if (now - start < 800) {
      requestAnimationFrame(tick);
      return;
    }
    if (frames < 8) return; // tab was backgrounded — inconclusive
    const slowRatio = slow / frames;
    if (slowRatio > 0.45) apply("lite");
    else if (slowRatio > 0.2 && current === "full") apply("mid");
  };

  requestAnimationFrame(tick);
}

export function initPerfTier(): () => void {
  if (typeof window === "undefined") return () => {};
  if (started) return () => {};
  started = true;

  apply(staticTier());

  const onVisibility = () => {
    if (document.hidden) document.documentElement.setAttribute("data-anim-paused", "");
    else document.documentElement.removeAttribute("data-anim-paused");
  };
  document.addEventListener("visibilitychange", onVisibility);
  onVisibility();

  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const onMotion = () => apply(staticTier());
  mq?.addEventListener?.("change", onMotion);

  // Probe once the first paint settled so route mount work isn't counted.
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number })
    .requestIdleCallback;
  if (idle) idle(() => probeFrames(), { timeout: 2500 });
  else window.setTimeout(probeFrames, 1200);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    mq?.removeEventListener?.("change", onMotion);
  };
}

export function getPerfTier(): PerfTier {
  return current ?? "full";
}

export function onPerfTierChange(fn: (t: PerfTier) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
