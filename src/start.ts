import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  const started = Date.now();
  try {
    const result = await next();
    // Request logging: only persist the failures/slow paths worth debugging.
    const status = (result as { response?: Response })?.response?.status;
    const duration = Date.now() - started;
    if (typeof status === "number" && status >= 500) {
      void import("./lib/error-log.server").then((m) =>
        m.queueErrorLog({
          source: "server",
          level: "error",
          message: `HTTP ${status} on ${new URL(request.url).pathname}`,
          route: new URL(request.url).pathname,
          url: request.url,
          method: request.method,
          status,
          durationMs: duration,
          userAgent: request.headers.get("user-agent"),
          context: { kind: "request_failure" },
        }),
      );
    }
    return result;
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    void import("./lib/error-log.server").then((m) => {
      const described = m.describeError(error);
      m.queueErrorLog({
        source: "server",
        level: "error",
        message: described.message,
        stack: described.stack ?? null,
        route: new URL(request.url).pathname,
        url: request.url,
        method: request.method,
        status: 500,
        durationMs: Date.now() - started,
        userAgent: request.headers.get("user-agent"),
        context: { kind: "unhandled_server_error" },
      });
    });
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
