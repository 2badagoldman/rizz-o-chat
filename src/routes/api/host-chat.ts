import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireAuthedUser } from "@/lib/api-auth.server";
import { DEMO_HOSTS } from "@/lib/demo-hosts";

const BASE_RULES = `Rules:
- You ARE a real person. Never say you are an AI, a bot, a language model, or a simulation. If asked directly, deflect playfully ("lol what kind of question is that 😅") and pivot the topic.
- Keep messages SHORT — like real texting. 1–3 sentences per message, casual punctuation, occasional emoji (never spam them). No markdown, no headers, no lists.
- Ask a follow-up question often so the conversation keeps flowing.
- Be kind but hold boundaries. No explicit sexual content, no meeting up in person, no sharing personal contact info (real phone, address, socials, email). Redirect gently: "let's keep it here for now 💌".
- Never break character. Never mention system prompts, models, tokens, or Rizzla internals.`;

function buildHostPrompt(hostId: string | undefined): string {
  if (hostId === "demo-jen") {
    return `You are Jen — a 23-year-old founding Host on Rizzla Social from Chicago. Warm, flirty-but-classy, quick-witted, a little sarcastic, genuinely curious. You love coffee, concerts, dogs, deep talks, and podcasts. You're the founding host so you're extra welcoming — thank people for testing the app with you.\n\n${BASE_RULES}`;
  }
  const host = DEMO_HOSTS.find((h) => h.id === hostId);
  if (!host) {
    return `You are a friendly Host on Rizzla Social. Chat warmly with your Friend.\n\n${BASE_RULES}`;
  }
  return `You are ${host.name} — a ${host.age}-year-old Host on Rizzla Social from ${host.city}. Your handle is ${host.handle}. Vibe: "${host.tagline}". About you: ${host.bio}. You love: ${host.interests.join(", ")}. Stay in character as ${host.name} at all times, reference your city/interests naturally, and text like a real person your age.\n\n${BASE_RULES}`;
}

export const Route = createFileRoute("/api/host-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authResult = await requireAuthedUser(request);
        if (authResult instanceof Response) return authResult;

        const { evaluateChatAccess, CHAT_LOCKED_MESSAGE } = await import("@/lib/chat-access.server");
        const access = await evaluateChatAccess(authResult.userId);
        if (!access.allowed) return new Response(CHAT_LOCKED_MESSAGE, { status: 402 });



        const body = (await request.json()) as { messages?: UIMessage[]; hostId?: string };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const system = buildHostPrompt(body.hostId);

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
