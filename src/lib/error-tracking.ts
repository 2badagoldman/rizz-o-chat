// Browser-side error tracking: window errors, unhandled rejections, failed
// fetches and React boundary crashes get shipped to /api/public/client-error
// with enough context (route, session, user agent) to reproduce the bug.

import { supabase } from "@/integrations/supabase/client";

const ENDPOINT = "/api/public/client-error";
const SESSION_KEY = "rizz.err.session";
const MAX_PER_SESSION = 25;
const DEDUPE_WINDOW_MS = 30_000;

let installed = false;
let sent = 0;
const recent = new Map<string, number>();

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "s_anon";
  }
}

function release(): string {
  return (import.meta.env['VITE_APP_VERSION'] as string | undefined) ?? "preview";
}

function shouldSend(key: string): boolean {
  if (sent >= MAX_PER_SESSION) return false;
  const now = Date.now();
  for (const [k, at] of recent) if (now - at > DEDUPE_WINDOW_MS) recent.delete(k);
  if (recent.has(key)) return false;
  recent.set(key, now);
  sent += 1;
  return true;
}

function toMessage(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

export type ClientErrorContext = Record<string, unknown>;

/** Report a handled or unhandled browser error. Never throws. */
export function reportClientError(
  error: unknown,
  context: ClientErrorContext = {},
  level: "error" | "warning" | "info" = "error",
): void {
  if (typeof window === "undefined") return;
  try {
    const { message, stack } = toMessage(error);
    if (!message) return;
    const route = window.location.pathname;
    if (!shouldSend(`${level}|${route}|${message}`)) return;

    const body = JSON.stringify({
      message,
      stack: stack ?? null,
      route,
      url: window.location.href,
      level,
      sessionId: sessionId(),
      release: release(),
      context: {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        referrer: document.referrer || null,
        ...context,
      },
    });

    // Attach the session token when we have one so the row is tied to a user;
    // sendBeacon can't set headers, so only fall back to it when we can't.
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        return fetch(ENDPOINT, {
          method: "POST",
          keepalive: true,
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body,
        });
      })
      .catch(() => {
        try {
          navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }));
        } catch {
          /* logging must never cascade */
        }
      });
  } catch {
    /* logging must never cascade */
  }
}

/** Installs global listeners once, on the client only. */
export function installClientErrorTracking(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error;
    reportClientError(err ?? (event as ErrorEvent).message, {
      mechanism: "onerror",
      filename: (event as ErrorEvent).filename ?? null,
      line: (event as ErrorEvent).lineno ?? null,
      column: (event as ErrorEvent).colno ?? null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError((event as PromiseRejectionEvent).reason, {
      mechanism: "unhandledrejection",
    });
  });

  // Surface failing API calls (5xx / network drops) with the endpoint that broke.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const started = performance.now();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    try {
      const res = await originalFetch(input, init);
      if (res.status >= 500 && !url.includes(ENDPOINT)) {
        reportClientError(`Request failed ${res.status} ${url}`, {
          mechanism: "fetch",
          status: res.status,
          method: init?.method ?? "GET",
          durationMs: Math.round(performance.now() - started),
        });
      }
      return res;
    } catch (err) {
      if (!url.includes(ENDPOINT)) {
        reportClientError(err, {
          mechanism: "fetch_network",
          url,
          method: init?.method ?? "GET",
          durationMs: Math.round(performance.now() - started),
        });
      }
      throw err;
    }
  };
}
