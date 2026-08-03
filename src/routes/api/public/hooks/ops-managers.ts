import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled entry point for the ops managers.
 * Called by the database scheduler with the project apikey header.
 */
export const Route = createFileRoute("/api/public/hooks/ops-managers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env["SUPABASE_ANON_KEY"] ?? "";
        if (!expected || apikey !== expected) {
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
