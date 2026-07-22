import { createFileRoute } from "@tanstack/react-router";
import { runBrainCore } from "@/lib/showcase-brain.functions";

// Called by pg_cron on a schedule to keep the welcome showcase self-improving.
// Auth: apikey header must match Supabase publishable key.
export const Route = createFileRoute("/api/public/hooks/showcase-brain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey") ?? request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!apiKey || apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }
        try {
          const result = await runBrainCore("cron");
          return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500 });
        }
      },
    },
  },
});
