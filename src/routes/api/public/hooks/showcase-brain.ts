import { createFileRoute } from "@tanstack/react-router";
import { runBrainCore } from "@/lib/showcase-brain.functions";

// Called by pg_cron on a schedule to keep the welcome showcase self-improving.
// Auth: the `x-cron-secret` header must match the server-only SHOWCASE_CRON_SECRET.
// The publishable/anon key is NOT accepted here — it ships to every browser.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hooks/showcase-brain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SHOWCASE_CRON_SECRET;
        const provided = request.headers.get("x-cron-secret") ?? "";
        if (!expected || !provided || !safeEqual(provided, expected)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
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
