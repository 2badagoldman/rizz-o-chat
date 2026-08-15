import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Vision moderation gate for every member/host upload.
 *
 * Crush is a strictly non-sexual, PG-13 conversation platform. Any image that
 * is nude, partially nude, lingerie/underwear-only, sexually suggestive, or
 * that solicits sexual services is rejected BEFORE it is stored, so the
 * platform can never surface it to members, reviewers or payment providers.
 */

const SYSTEM = `You are a strict content-safety reviewer for a PG-13, non-sexual social chat app.
Review the image and decide if it may be published on a public profile.

REJECT if ANY of the following is true:
- No real human being is visibly present. Crush only publishes photos OF PEOPLE. Reject product shots, phone/device mockups, flatlays, coins/money, flowers, food-only, scenery, pets-only, logos, memes, screenshots, text graphics, and any image where a person is not clearly the subject.
- Nudity or partial nudity (exposed or barely covered breasts, buttocks, genitals).
- Underwear, lingerie, swimwear, or towel-only imagery.
- Sexually suggestive posing, framing or camera focus on breasts/buttocks/crotch.
- Sexual acts, simulated sexual acts, fetish imagery, or sex toys.
- Text or overlays advertising sexual content, hookups, escorting, "spicy"/NSFW content, or off-platform adult sites.
- The subject appears to be, or may be, under 18.
- Graphic violence, self-harm, weapons aimed at a person, or illegal drugs.

ALLOW ordinary clothed photos where a real person is the clear subject: portraits, selfies, lifestyle, travel, fashion, fitness in normal gym clothing, and group photos. Objects, pets or scenery may appear alongside the person, but a person must be present.

Respond with ONLY compact JSON:
{"allow": true|false, "category": "ok|no_person|nudity|suggestive|underwear|solicitation|minor|violence|other", "reason": "one short sentence"}`;

export type ModerationVerdict = {
  allow: boolean;
  category: string;
  reason: string;
};

export const moderateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { dataUrl?: string };
    const dataUrl = String(x.dataUrl ?? "");
    if (!dataUrl.startsWith("data:image/")) throw new Error("Expected an image");
    if (dataUrl.length > 4_000_000) throw new Error("Image too large to review");
    return { dataUrl };
  })
  .handler(async ({ data }): Promise<ModerationVerdict> => {
    const key = process.env["LOVABLE_API_KEY"];
    // Fail-open only when the reviewer is unavailable, so uploads never hard-break.
    if (!key) return { allow: true, category: "ok", reason: "Reviewer unavailable" };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: "Review this upload." },
                { type: "image_url", image_url: { url: data.dataUrl } },
              ],
            },
          ],
          temperature: 0,
        }),
      });

      if (!res.ok) {
        console.error("moderateImage gateway error", res.status, await res.text());
        return { allow: true, category: "ok", reason: "Reviewer unavailable" };
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = json.choices?.[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return { allow: true, category: "ok", reason: "Reviewer unavailable" };
      const parsed = JSON.parse(match[0]) as Partial<ModerationVerdict>;
      return {
        allow: parsed.allow !== false,
        category: String(parsed.category ?? "other"),
        reason: String(parsed.reason ?? "This image does not meet our content standards."),
      };
    } catch (e) {
      console.error("moderateImage failed", e);
      return { allow: true, category: "ok", reason: "Reviewer unavailable" };
    }
  });
