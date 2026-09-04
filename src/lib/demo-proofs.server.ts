import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { RUNWAY_SLOTS } from "./creator-identity";
import { localHostPortrait } from "./host-avatars";
import type { DemoProof } from "./demo-proofs.data";

/**
 * Runway proofs. Slot i (a fixed persona ↔ creator pair from the Creator
 * Identity Manager) is paired with the i-th held-back showcase photo under a
 * fully deterministic ordering, so a card's photo, name and destination
 * profile agree on every surface and every page load, whatever `limit` is.
 *
 * Even slots show the showcase shoot, odd slots the bundled AI portrait; any
 * slot without a usable photo falls back to the bundled portrait so a card can
 * never render black.
 */
export async function loadDemoProofs(limit: number): Promise<DemoProof[]> {
  const slots = RUNWAY_SLOTS.slice(0, Math.max(0, limit));
  if (slots.length === 0) return [];

  const { data: rows } = await supabaseAdmin
    .from("showcase_media")
    .select("id, storage_path")
    .eq("is_active", false)
    .eq("media_type", "image")
    .order("ai_score", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(slots.length);

  const list = rows ?? [];
  const signed = await Promise.all(
    list.map((row) =>
      supabaseAdmin.storage
        .from("showcase")
        .createSignedUrl(row.storage_path, 60 * 60)
        .then(({ data }) => data?.signedUrl ?? "")
        .catch(() => ""),
    ),
  );

  const out: DemoProof[] = [];
  slots.forEach((slot, i) => {
    const remote = signed[i] ?? "";
    const local = localHostPortrait(slot.host.id);
    const image = i % 2 === 0 && remote ? remote : local || remote;
    if (!image) return;
    out.push({
      id: list[i]?.id ?? `slot-${slot.host.id}`,
      hostId: slot.host.id,
      name: slot.host.name,
      age: slot.host.age,
      tagline: slot.host.tagline,
      image,
      lines: slot.persona.lines,
    });
  });
  return out;
}
