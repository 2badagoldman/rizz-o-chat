import { createServerFn } from "@tanstack/react-start";

/**
 * Marketing "proof of concept" demos.
 *
 * Pulls the highest-performing showcase photos that are held back from the
 * public feed and pairs each one with a scripted 4-message conversation.
 * These are used for advertising screenshots, the admin demo page and the
 * social-proof strip at the bottom of the marketing home page.
 */

import { PERSONAS } from "./demo-proofs.data";
export type { DemoLine, DemoProof } from "./demo-proofs.data";
import type { DemoProof } from "./demo-proofs.data";

export const getDemoProofs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { limit?: number };
    const n = typeof i.limit === "number" && i.limit > 0 && i.limit <= 12 ? i.limit : 6;
    return { limit: n };
  })
  .handler(async ({ data }): Promise<DemoProof[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Marketing pool = the strongest photos held out of the public feed.
    const { data: rows } = await supabaseAdmin
      .from("showcase_media")
      .select("id, storage_path, media_type, ai_score")
      .eq("is_active", false)
      .eq("media_type", "image")
      .order("ai_score", { ascending: false })
      .limit(data.limit);

    const out: DemoProof[] = [];
    let idx = 0;
    for (const r of rows ?? []) {
      const { data: signed } = await supabaseAdmin.storage
        .from("showcase")
        .createSignedUrl(r.storage_path, 60 * 60);
      if (!signed?.signedUrl) continue;
      const persona = PERSONAS[idx % PERSONAS.length];
      idx += 1;
      out.push({
        id: r.id,
        name: persona.name,
        age: persona.age,
        tagline: persona.tagline,
        image: signed.signedUrl,
        lines: persona.lines,
      });
    }
    return out;
  });
