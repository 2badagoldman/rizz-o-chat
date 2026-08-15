import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireAuthedUser } from "@/lib/api-auth.server";
import { buildHostPrompt } from "@/lib/host-persona.server";

export const Route = createFileRoute("/api/host-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authResult = await requireAuthedUser(request);
        if (authResult instanceof Response) return authResult;

        const { evaluateChatAccess, CHAT_LOCKED_MESSAGE } = await import("@/lib/chat-access.server");
        const access = await evaluateChatAccess(authResult.userId);
        if (!access.allowed) return new Response(CHAT_LOCKED_MESSAGE, { status: 402 });



        const body = (await request.json()) as { messages?: UIMessage[]; hostId?: string; memberName?: string; memberNotes?: string };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const system = buildHostPrompt(body.hostId, {
          allowUpsell: true,
          memberName: typeof body.memberName === "string" ? body.memberName.slice(0, 24) : undefined,
          memberNotes: typeof body.memberNotes === "string" ? body.memberNotes.slice(0, 1200) : undefined,
        });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
        });
      },
    },
  },
});
