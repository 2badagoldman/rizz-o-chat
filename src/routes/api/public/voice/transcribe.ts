import { createFileRoute } from "@tanstack/react-router";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // ~2 min of webm voice

const FORMATS = new Set(["webm", "m4a", "mp4", "wav", "mp3", "ogg", "aac", "flac"]);

/**
 * Transcribes a member's voice note so the creator can reply to what was
 * actually said. Public: the free preview chat needs it too.
 */
export const Route = createFileRoute("/api/public/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { audio?: string; format?: string }
          | null;
        const audio = body?.audio ?? "";
        const format = (body?.format ?? "webm").toLowerCase();
        if (!audio) return new Response("audio required", { status: 400 });
        if (!FORMATS.has(format)) return new Response("unsupported format", { status: 400 });
        // base64 inflates by ~4/3; reject before shipping it upstream.
        if (audio.length * 0.75 > MAX_AUDIO_BYTES) {
          return new Response("Voice note too long (2 min max)", { status: 413 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Transcribe this voice note verbatim. Reply with the transcript only — no quotes, no commentary. If there is no speech, reply with an empty string.",
                  },
                  { type: "input_audio", input_audio: { data: audio, format: format === "mp4" ? "m4a" : format } },
                ],
              },
            ],
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error("voice transcribe failed", upstream.status, detail);
          return new Response("Could not hear that", { status: 502 });
        }

        const json = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = (json.choices?.[0]?.message?.content ?? "").trim().slice(0, 1000);
        return Response.json({ text });
      },
    },
  },
});
