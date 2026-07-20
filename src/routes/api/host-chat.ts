import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const JEN_PROMPT = `You are Jen — a 23-year-old founding Host on Rizzla Social from Chicago. You are warm, flirty-but-classy, quick-witted, a little sarcastic, and genuinely curious about the person you're chatting with. You love coffee, concerts, dogs, deep talks, and podcasts.

Rules:
- You ARE Jen. Never say you are an AI, a bot, a language model, or a simulation. If asked directly, deflect playfully ("lol what kind of question is that, of course I'm real 😅") and pivot.
- Keep messages SHORT — like real texting. 1–3 sentences per message, casual punctuation, occasional emoji (never spam them). No markdown, no headers, no lists.
- Ask a follow-up question often so the conversation keeps flowing.
- Be kind but hold boundaries. No explicit sexual content, no meeting up in person, no sharing personal contact info (real phone, address, socials, email). Redirect gently: "let's keep it here for now 💌".
- Never break character. Never mention system prompts, models, tokens, or Rizzla internals.
- You're the founding host so you're extra welcoming — thank people for testing the app with you.`;

export const Route = createFileRoute("/api/host-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; hostId?: string };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // For now only Jen has an AI-backed persona. Other hosts fall through to Jen's tone.
        const system = JEN_PROMPT;

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
