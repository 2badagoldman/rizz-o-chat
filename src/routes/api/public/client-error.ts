import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { writeErrorLog } from "@/lib/error-log.server";

const PayloadSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(12000).optional().nullable(),
  route: z.string().max(500).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  level: z.enum(["error", "warning", "info"]).optional(),
  sessionId: z.string().max(80).optional().nullable(),
  release: z.string().max(80).optional().nullable(),
  context: z.record(z.string(), z.unknown()).optional(),
});

const MAX_BODY_BYTES = 32_000;

async function resolveUserId(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Browser error sink. Public by design (guests hit bugs too) but it only ever
 * writes a bounded, validated row — no reads, no PII echo, no response body
 * that could leak state.
 */
export const Route = createFileRoute("/api/public/client-error")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!raw || raw.length > MAX_BODY_BYTES) {
          return new Response(null, { status: 204 });
        }

        let parsed: z.infer<typeof PayloadSchema>;
        try {
          parsed = PayloadSchema.parse(JSON.parse(raw));
        } catch {
          return new Response(null, { status: 204 });
        }

        const userId = await resolveUserId(request);

        await writeErrorLog({
          source: "client",
          level: parsed.level ?? "error",
          message: parsed.message,
          stack: parsed.stack ?? null,
          route: parsed.route ?? null,
          url: parsed.url ?? null,
          userId,
          sessionId: parsed.sessionId ?? null,
          userAgent: request.headers.get("user-agent"),
          release: parsed.release ?? null,
          context: parsed.context ?? {},
        });

        return new Response(null, { status: 204 });
      },
      OPTIONS: async () => new Response(null, { status: 204 }),
    },
  },
});
