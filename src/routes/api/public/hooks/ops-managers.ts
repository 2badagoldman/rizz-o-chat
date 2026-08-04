import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled entry point for the ops managers.
 * Auth: the `x-cron-secret` header must match the server-only OPS_CRON_SECRET.
 * The publishable/anon key is NOT accepted — it ships to every browser.
 */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hooks/ops-managers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-secret") ?? "";
        const expected = process.env["OPS_CRON_SECRET"] ?? "";
        if (!expected || !provided || !safeEqual(provided, expected)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { MANAGERS, runManagers } = await import("@/lib/ops.server");

        const results = await runManagers(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabaseAdmin as any,
          MANAGERS.map((m) => m.id),
          "schedule",
        );

        return Response.json({ ok: true, results });
      },
    },
  },
});
