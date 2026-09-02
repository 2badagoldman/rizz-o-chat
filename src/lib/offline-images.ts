// Offline image warm-up.
//
// Every creator portrait ships inside the app bundle (src/assets/**), so the
// app never depends on a remote CDN or on expiring signed storage URLs. This
// module eagerly downloads each bundled image once, so after the first visit
// all creator scrolls, cards and profiles render instantly and keep working
// with no network at all.

const bundled = import.meta.glob("@/assets/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Every locally bundled image URL, sorted for deterministic ordering. */
export const BUNDLED_IMAGE_URLS: string[] = Object.entries(bundled)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);

const CACHE_NAME = "crush-offline-images-v1";
let started = false;

function warmViaImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Download and persist all bundled images. Runs once per session, in small
 * batches so it never competes with the visible page for bandwidth.
 */
export async function warmOfflineImages(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;

  const urls = BUNDLED_IMAGE_URLS;

  // Persist into Cache Storage when available so the images survive reloads
  // and are served with no network round-trip.
  if ("caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (let i = 0; i < urls.length; i += 8) {
        const batch = urls.slice(i, i + 8);
        await Promise.allSettled(
          batch.map(async (url) => {
            const hit = await cache.match(url);
            if (hit) return;
            const res = await fetch(url, { cache: "force-cache" });
            if (res.ok) await cache.put(url, res.clone());
          }),
        );
      }
    } catch {
      // Cache Storage unavailable (private mode / quota) — fall through.
    }
  }

  // Decode into the in-memory image cache so first paint is instant.
  for (let i = 0; i < urls.length; i += 8) {
    await Promise.all(urls.slice(i, i + 8).map(warmViaImage));
  }
}

/** Kick the warm-up off when the browser is idle. */
export function scheduleOfflineImageWarmup(): void {
  if (typeof window === "undefined") return;
  const run = () => {
    void warmOfflineImages();
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (typeof ric === "function") ric(run);
  else window.setTimeout(run, 1200);
}
