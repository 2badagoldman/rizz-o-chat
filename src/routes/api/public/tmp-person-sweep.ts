import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY maintenance endpoint — removed after the one-time sweep.
export const Route = createFileRoute("/api/public/tmp-person-sweep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-sweep") !== "crush-person-sweep-2026") {
          return new Response("no", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const key = process.env["LOVABLE_API_KEY"]!;

        const { data: rows } = await supabaseAdmin
          .from("showcase_media")
          .select("id, storage_path, caption, media_type")
          .eq("is_active", true)
          .eq("media_type", "image");

        const out: Array<{ id: string; caption: string | null; person: boolean; why: string }> = [];
        for (const r of rows ?? []) {
          const { data: signed } = await supabaseAdmin.storage
            .from("showcase")
            .createSignedUrl(r.storage_path, 600);
          if (!signed?.signedUrl) continue;
          const img = await fetch(signed.signedUrl);
          const buf = Buffer.from(await img.arrayBuffer());
          const dataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              temperature: 0,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: 'Is a real human being clearly the subject of this photo? Product shots, phone/device mockups, flatlays, coins, flowers, food, scenery, logos, memes, screenshots and text graphics are NOT people. Reply only JSON: {"person": true|false, "why": "few words"}',
                    },
                    { type: "image_url", image_url: { url: dataUrl } },
                  ],
                },
              ],
            }),
          });
          const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const m = (j.choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/);
          const parsed = m ? (JSON.parse(m[0]) as { person?: boolean; why?: string }) : {};
          out.push({ id: r.id, caption: r.caption, person: parsed.person === true, why: String(parsed.why ?? "") });
        }
        return Response.json(out);
      },
    },
  },
});
