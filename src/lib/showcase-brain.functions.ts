import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: fetch a fresh, ranked reel + log anonymous engagement events.
// These do not require sign-in — the welcome showcase plays for everyone.
// ─────────────────────────────────────────────────────────────────────────────

export interface ReelItem {
  id: string;
  caption: string | null;
  media_type: "image" | "video";
  storage_path: string;
  url: string;
  score: number;
}

export const getShowcaseReel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { limit?: number };
    const n = typeof i.limit === "number" && i.limit > 0 && i.limit <= 25 ? i.limit : 8;
    return { limit: n };
  })
  .handler(async ({ data }): Promise<ReelItem[]> => {
    // Use the admin client so signed URLs can be minted for the public welcome
    // reel without requiring the visitor to be signed in.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin.rpc("get_showcase_reel", { _limit: data.limit });
    if (error || !rows) return [];

    const items: ReelItem[] = [];
    for (const r of rows as Array<{
      id: string;
      caption: string | null;
      media_type: string;
      storage_path: string;
      score: number;
    }>) {
      const { data: signed } = await supabaseAdmin.storage.from("showcase").createSignedUrl(r.storage_path, 60 * 60);
      if (!signed?.signedUrl) continue;
      items.push({
        id: r.id,
        caption: sanitizeShowcaseCaption(r.caption, r.id),
        media_type: (r.media_type === "video" ? "video" : "image") as "image" | "video",
        storage_path: r.storage_path,
        url: signed.signedUrl,
        score: r.score,
      });
    }
    return items;
  });

export const logShowcaseEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { id?: string; event?: string };
    if (!i.id || typeof i.id !== "string") throw new Error("id required");
    const ev = i.event === "dismiss" || i.event === "complete" ? i.event : "impression";
    return { id: i.id, event: ev };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supa = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    await supa.rpc("log_showcase_event", { _id: data.id, _event: data.event });
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: brain status + run + settings
// ─────────────────────────────────────────────────────────────────────────────

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const getBrainStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [settings, runs, items] = await Promise.all([
      supabaseAdmin.from("showcase_brain_settings").select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("showcase_brain_runs").select("*").order("ran_at", { ascending: false }).limit(15),
      supabaseAdmin
        .from("showcase_media")
        .select("id, caption, original_caption, ai_score, impressions, dismisses, completes, ai_caption_updated_at, sort_order, is_active, storage_path")
        .order("ai_score", { ascending: false })
        .limit(60),
    ]);
    return {
      settings: settings.data ?? null,
      runs: runs.data ?? [],
      items: items.data ?? [],
    };
  });

export const updateBrainSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as {
      enabled?: boolean;
      cadence_minutes?: number;
      reel_size?: number;
      refresh_caption_after_hours?: number;
      tone?: string;
    };
    return {
      enabled: typeof i.enabled === "boolean" ? i.enabled : undefined,
      cadence_minutes: typeof i.cadence_minutes === "number" ? Math.max(15, Math.min(1440, i.cadence_minutes)) : undefined,
      reel_size: typeof i.reel_size === "number" ? Math.max(3, Math.min(25, i.reel_size)) : undefined,
      refresh_caption_after_hours: typeof i.refresh_caption_after_hours === "number" ? Math.max(1, Math.min(720, i.refresh_caption_after_hours)) : undefined,
      tone: typeof i.tone === "string" && i.tone.trim().length > 0 ? i.tone.slice(0, 200) : undefined,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(data)) if (v !== undefined) patch[k] = v;
    const { error } = await supabaseAdmin.from("showcase_brain_settings").update(patch as never).eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

export const runBrainNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return await runBrainCore("manual");
  });

// ─────────────────────────────────────────────────────────────────────────────
// Core brain worker — reused by manual trigger + cron.
// Scores every active item by engagement, then uses Lovable AI to refresh
// captions on the top items whose captions are stale.
// ─────────────────────────────────────────────────────────────────────────────

export async function runBrainCore(trigger: "manual" | "cron") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: settings } = await supabaseAdmin
    .from("showcase_brain_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!settings) throw new Error("brain settings missing");
  if (trigger === "cron" && !settings.enabled) {
    return { skipped: true, reason: "brain disabled" };
  }

  const tone: string = settings.tone ?? "playful, warm, elite, inviting";
  const staleHours: number = settings.refresh_caption_after_hours ?? 24;
  const reelSize: number = settings.reel_size ?? 8;

  // 1) Recompute ai_score for every active item using engagement.
  const { data: items } = await supabaseAdmin
    .from("showcase_media")
    .select("id, caption, original_caption, impressions, dismisses, completes, ai_score, ai_caption_updated_at, sort_order, created_at")
    .eq("is_active", true);
  const rows = items ?? [];

  let scored = 0;
  for (const it of rows) {
    const imp = Math.max(1, it.impressions ?? 0);
    const completeRate = (it.completes ?? 0) / imp;
    const dismissRate = (it.dismisses ?? 0) / imp;
    // Blend prior score 60% with fresh signal 40%; add tiny recency bonus.
    const recency = Math.max(0, 30 - daysSince(it.created_at)) / 300; // 0.0 → 0.1
    const signal = 0.5 + completeRate * 0.6 - dismissRate * 0.7 + recency;
    const nextScore = clamp(0.05, 1.0, (it.ai_score ?? 0.5) * 0.6 + clamp(0.05, 1.0, signal) * 0.4);
    if (Math.abs(nextScore - (it.ai_score ?? 0.5)) > 0.01) {
      await supabaseAdmin.from("showcase_media").update({ ai_score: nextScore }).eq("id", it.id);
    }
    scored++;
  }

  // 2) Refresh captions on top-N items whose captions are stale.
  const key = process.env.LOVABLE_API_KEY;
  const staleCutoff = Date.now() - staleHours * 3600 * 1000;
  const top = [...rows]
    .sort((a, b) => (b.ai_score ?? 0.5) - (a.ai_score ?? 0.5))
    .slice(0, reelSize);
  const targets = top.filter((r) => {
    const t = r.ai_caption_updated_at ? new Date(r.ai_caption_updated_at).getTime() : 0;
    return t < staleCutoff;
  });

  let refreshed = 0;
  if (key && targets.length > 0) {
    const system = [
      `You are the Crush Welcome Showcase Copywriter.`,
      `Crush is a chat entertainment app where verified women (Hosts) run paid Friends Lists.`,
      `Write ONE punchy welcome caption per slide. Tone: ${tone}.`,
      `Rules: max 60 chars, no hashtags, no @mentions, no quotes, one emoji max, invite the viewer to join the conversation / chat / say hi.`,
      `STRICTLY NON-SEXUAL and non-suggestive: no flirting, seduction, innuendo, "private", "secret", "behind closed doors", "heat", "spicy", "babe", "naughty", "tease", "DM me for more", and no suggestive emoji (💋😏🔥🌶️🍑🍆😈).`,
      `Keep it PG-13 and friendship-focused: shared interests, everyday life, encouragement, light banter.`,
      `Vary phrasing across slides — do not repeat verbs or emojis. Never mention prices.`,

      `Return STRICT JSON: {"captions":[{"id":"<uuid>","caption":"..."}]}. Include one entry per input id, in the same order.`,
    ].join("\n");
    const user = JSON.stringify({
      slides: targets.map((t) => ({ id: t.id, current: t.caption ?? t.original_caption ?? "" })),
    });

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const raw = j?.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
        const list: Array<{ id: string; caption: string }> = Array.isArray(parsed?.captions) ? parsed.captions : [];
        for (const c of list) {
          const clean = String(c.caption ?? "").trim().slice(0, 80);
          if (!clean || !c.id) continue;
          // Preserve original caption once so we can always recover creator intent.
          const target = targets.find((t) => t.id === c.id);
          const patch: Record<string, unknown> = {
            caption: clean,
            ai_caption_updated_at: new Date().toISOString(),
          };
          if (target && !target.original_caption && target.caption) {
            patch.original_caption = target.caption;
          }
          await supabaseAdmin.from("showcase_media").update(patch as never).eq("id", c.id);
          refreshed++;
        }
      }
    } catch {
      // brain failure shouldn't block the app; log via runs table below
    }
  }

  const note = `${trigger} · scored ${scored} · refreshed ${refreshed}`;
  await supabaseAdmin.from("showcase_brain_runs").insert({
    trigger,
    items_scored: scored,
    captions_refreshed: refreshed,
    note,
  });
  await supabaseAdmin
    .from("showcase_brain_settings")
    .update({ last_run_at: new Date().toISOString(), last_run_note: note })
    .eq("id", 1);

  return { ok: true, scored, refreshed };
}

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}
function daysSince(iso: string | null | undefined) {
  if (!iso) return 30;
  return (Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000);
}
