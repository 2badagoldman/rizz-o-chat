import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AI_HOST_IDS, DEMO_HOSTS } from "./demo-hosts";
import { PERSONAS, type DemoProof } from "./demo-proofs.data";

export async function loadDemoProofs(limit: number): Promise<DemoProof[]> {
  const { data: rows } = await supabaseAdmin
    .from("showcase_media")
    .select("id, storage_path, media_type, ai_score")
    .eq("is_active", false)
    .eq("media_type", "image")
    .order("ai_score", { ascending: false })
    .limit(limit);

  const out: DemoProof[] = [];
  for (const [index, row] of (rows ?? []).entries()) {
    const { data: signed } = await supabaseAdmin.storage
      .from("showcase")
      .createSignedUrl(row.storage_path, 60 * 60);
    if (!signed?.signedUrl) continue;

    const persona = PERSONAS[index % PERSONAS.length];
    const namedHost = DEMO_HOSTS.find(
      (host) => host.name.toLowerCase() === persona.name.toLowerCase(),
    );
    const fallbackId = AI_HOST_IDS[index % AI_HOST_IDS.length];
    const host = namedHost ?? DEMO_HOSTS.find((candidate) => candidate.id === fallbackId);
    if (!host) continue;

    out.push({
      id: row.id,
      hostId: host.id,
      name: host.name,
      age: host.age,
      tagline: host.tagline,
      image: signed.signedUrl,
      lines: persona.lines,
    });
  }
  return out;
}