import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { AI_HOST_IDS } from "@/lib/demo-hosts";
import { buildHostPrompt } from "@/lib/host-persona.server";

export const Route = createFileRoute("/api/public/demo-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; hostId?: string; memberName?: string };
        const hostId = body.hostId ?? "";

        if (!(AI_HOST_IDS as readonly string[]).includes(hostId)) {
          return new Response("This creator isn't open for free chat.", { status: 403 });
        }
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system:
            buildHostPrompt(hostId, { allowUpsell: true }) +
            (typeof body.memberName === "string" && body.memberName.trim()
              ? `\n\nHis name is ${body.memberName.trim().slice(0, 24)}. Use it naturally — early, and again when it lands warmly. Never overuse it.`
              : ""),
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});
