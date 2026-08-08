// Server-side sink for both browser-reported errors and server request failures.
// Writes with the service role so log rows can never be forged from the client.

export type ErrorLogEntry = {
  source: "client" | "server";
  level?: "error" | "warning" | "info";
  message: string;
  stack?: string | null;
  route?: string | null;
  url?: string | null;
  method?: string | null;
  status?: number | null;
  durationMs?: number | null;
  userId?: string | null;
  sessionId?: string | null;
  userAgent?: string | null;
  release?: string | null;
  context?: Record<string, unknown>;
};

const MAX_MESSAGE = 2_000;
const MAX_STACK = 12_000;
const MAX_TEXT = 500;

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** Groups repeats of the same bug: message + first meaningful stack frame. */
export function fingerprintOf(message: string, stack?: string | null, route?: string | null) {
  const frame =
    (stack ?? "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("at ")) ?? "";
  const normalized = `${route ?? ""}|${message}|${frame}`
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\d+/g, "<n>")
    .slice(0, 300);
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
  }
  return `f_${(hash >>> 0).toString(36)}`;
}

/**
 * Never throws and never blocks the caller — logging must not be able to break
 * the very request it is trying to describe.
 */
export async function writeErrorLog(entry: ErrorLogEntry): Promise<void> {
  try {
    const message = clip(entry.message, MAX_MESSAGE) ?? "Unknown error";
    const stack = clip(entry.stack, MAX_STACK);
    const route = clip(entry.route, MAX_TEXT);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("error_logs").insert({
      source: entry.source,
      level: entry.level ?? "error",
      message,
      stack,
      route,
      url: clip(entry.url, MAX_TEXT),
      method: clip(entry.method, 12),
      status: entry.status ?? null,
      duration_ms: entry.durationMs ?? null,
      fingerprint: fingerprintOf(message, stack, route),
      user_id: entry.userId ?? null,
      session_id: clip(entry.sessionId, 80),
      user_agent: clip(entry.userAgent, MAX_TEXT),
      release: clip(entry.release, 80),
      context: (entry.context ?? {}) as never,
    });
  } catch (err) {
    console.error("[error-log] failed to persist entry", err);
  }
}

/** Fire-and-forget helper for hot paths (request middleware). */
export function queueErrorLog(entry: ErrorLogEntry): void {
  void writeErrorLog(entry);
}

export function describeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack ?? undefined };
  if (error instanceof Response) return { message: `Response ${error.status} ${error.url ?? ""}`.trim() };
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}
