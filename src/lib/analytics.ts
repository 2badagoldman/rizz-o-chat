// Lightweight client-side analytics tracker.
// Writes directly to the analytics_events table via the anon key (RLS allows insert).
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rizzla:sid";
const SESSION_START_KEY = "rizzla:sid_start";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min inactivity

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function detectCountry(): string | undefined {
  if (typeof Intl === "undefined") return undefined;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Coarse mapping: use timezone continent/region so we don't need a geo IP call.
    return tz ?? undefined;
  } catch {
    return undefined;
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const now = Date.now();
  const started = Number(sessionStorage.getItem(SESSION_START_KEY) ?? 0);
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid || !started || now - started > SESSION_TTL_MS) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  sessionStorage.setItem(SESSION_START_KEY, String(now));
  return sid;
}

async function currentUserId(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id;
  } catch {
    return undefined;
  }
}

type TrackInput = {
  event_type: string;
  path?: string;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
};

let queue: TrackInput[] = [];
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, queue.length);
  const uid = await currentUserId();
  const rows = batch.map((e) => ({
    session_id: getSessionId(),
    user_id: uid ?? null,
    event_type: e.event_type,
    path: e.path ?? (typeof location !== "undefined" ? location.pathname : null),
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    device: detectDevice(),
    country: detectCountry() ?? null,
    duration_ms: e.duration_ms ?? null,
    metadata: e.metadata ?? null,
  }));
  try {
    await supabase.from("analytics_events").insert(rows as never);
  } catch {
    // Swallow — analytics must never break the app.
  } finally {
    flushing = false;
  }
}

export function track(event_type: string, extras?: Omit<TrackInput, "event_type">) {
  if (typeof window === "undefined") return;
  queue.push({ event_type, ...extras });
  // Micro-debounce so consecutive events batch.
  setTimeout(flush, 300);
}

export function trackPageview(path: string) {
  track("pageview", { path });
}

// Session heartbeat — sends a ping every 30s while the tab is visible so we can
// measure real dwell time even for single-page visits.
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pageEnteredAt = Date.now();

export function startAnalytics() {
  if (typeof window === "undefined") return;
  getSessionId();
  pageEnteredAt = Date.now();

  const beat = () => {
    if (document.visibilityState !== "visible") return;
    track("heartbeat", { duration_ms: Date.now() - pageEnteredAt });
  };
  heartbeatTimer = setInterval(beat, 30_000);

  window.addEventListener("beforeunload", () => {
    try {
      const uid = supabase.auth.getSession();
      void uid; // best-effort
      const row = {
        session_id: getSessionId(),
        user_id: null,
        event_type: "session_end",
        path: location.pathname,
        referrer: document.referrer || null,
        device: detectDevice(),
        country: detectCountry() ?? null,
        duration_ms: Date.now() - pageEnteredAt,
        metadata: null,
      };
      const blob = new Blob(
        [JSON.stringify([row])],
        { type: "application/json" },
      );
      // Best-effort exit ping — RLS still allows anon inserts.
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const fd = new FormData();
      fd.append("payload", blob);
      // Use sendBeacon-friendly fetch fallback (sendBeacon can't set headers we need).
      void fetch(url, {
        method: "POST",
        keepalive: true,
        headers: {
          "content-type": "application/json",
          apikey: key,
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify([row]),
      }).catch(() => {});
    } catch {
      // ignore
    }
  });
}

export function markPageEntered() {
  pageEnteredAt = Date.now();
}

export function stopAnalytics() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}
