import { createFileRoute } from "@tanstack/react-router";
import { creatorVoice, MAX_TTS_CHARS } from "@/lib/creator-voices";

/**
 * Creator voice notes.
 *
 * Turns a creator's chat reply into her spoken voice. Public because the free
 * preview chat (no account) is exactly where hearing her voice closes the sale;
 * input is capped so it can't be used as a general TTS farm.
 */
export const Route = createFileRoute("/api/public/voice/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { text?: string; hostId?: string }
          | null;
        const text = (body?.text ?? "").trim().slice(0, MAX_TTS_CHARS);
        if (!text) return new Response("text required", { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { voice, instructions } = creatorVoice(body?.hostId);

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            instructions,
            response_format: "mp3",
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error("voice tts failed", upstream.status, detail);
          return new Response("Voice unavailable", { status: upstream.status === 429 ? 429 : 502 });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
