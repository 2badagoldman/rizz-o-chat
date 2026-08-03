import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StoryGroup, StoryKind, StoryRow } from "@/lib/stories";

/** 24h story feed, grouped by author, newest-unseen first (Instagram style). */
export const listStories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StoryGroup[]> => {
    const me = context.userId;
    const { data: rows, error } = await context.supabase
      .from("stories")
      .select("id, author_id, kind, media_path, media_type, caption, accent, coin_value, created_at, expires_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) throw error;
    if (!rows?.length) return [];

    const ids = rows.map((r) => r.id);
    const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));

    const [{ data: views }, { data: profiles }] = await Promise.all([
      context.supabase.from("story_views").select("story_id, viewer_id").in("story_id", ids),
      context.supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds),
    ]);

    const seen = new Set((views ?? []).filter((v) => v.viewer_id === me).map((v) => v.story_id));
    const counts = new Map<string, number>();
    for (const v of views ?? []) counts.set(v.story_id, (counts.get(v.story_id) ?? 0) + 1);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    const groups = new Map<string, StoryGroup>();
    for (const r of rows) {
      const p = byId.get(r.author_id);
      const story: StoryRow = {
        ...r,
        kind: (r.kind ?? "media") as StoryKind,
        seen: seen.has(r.id),
        view_count: counts.get(r.id) ?? 0,
      };
      const g = groups.get(r.author_id) ?? {
        author_id: r.author_id,
        display_name: p?.display_name ?? "Crush member",
        avatar_url: p?.avatar_url ?? null,
        stories: [],
        allSeen: true,
      };
      g.stories.push(story);
      if (!story.seen) g.allSeen = false;
      groups.set(r.author_id, g);
    }

    const list = Array.from(groups.values());
    list.sort((a, b) => {
      if (a.author_id === me) return -1;
      if (b.author_id === me) return 1;
      if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1;
      return 0;
    });
    return list;
  });

export const createStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as {
      kind?: string;
      mediaPath?: string | null;
      mediaType?: string | null;
      caption?: string | null;
      accent?: string | null;
      coinValue?: number | null;
    };
    const kind = (["media", "gift", "coins", "text"].includes(x.kind ?? "") ? x.kind : "media") as StoryKind;
    const mediaPath = (x.mediaPath ?? "").trim() || null;
    if (mediaPath && mediaPath.includes("..")) throw new Error("Invalid media path");
    const caption = (x.caption ?? "").trim().slice(0, 280) || null;
    if (kind === "media" && !mediaPath) throw new Error("Add a photo or video");
    if (kind !== "media" && !caption && !x.coinValue) throw new Error("Add a message");
    return {
      kind,
      mediaPath,
      mediaType: (x.mediaType ?? null) as string | null,
      caption,
      accent: (x.accent ?? "sea").slice(0, 24),
      coinValue: x.coinValue == null ? null : Math.max(0, Math.min(1_000_000, Math.floor(Number(x.coinValue) || 0))),
    };
  })
  .handler(async ({ data, context }) => {
    if (data.mediaPath && !data.mediaPath.startsWith(`${context.userId}/`)) {
      throw new Error("Invalid media path");
    }
    const { data: row, error } = await context.supabase
      .from("stories")
      .insert({
        author_id: context.userId,
        kind: data.kind,
        media_path: data.mediaPath,
        media_type: data.mediaType,
        caption: data.caption,
        accent: data.accent,
        coin_value: data.coinValue,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const deleteStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: String((i as { id?: string })?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const markStoryViewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: String((i as { id?: string })?.id ?? "") }))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("story_views")
      .upsert({ story_id: data.id, viewer_id: context.userId }, { onConflict: "story_id,viewer_id" });
    return { ok: true };
  });

/** Author-only: who watched this story. */
export const listStoryViewers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: String((i as { id?: string })?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { data: story } = await context.supabase
      .from("stories")
      .select("author_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!story || story.author_id !== context.userId) throw new Error("Not allowed");

    const { data: views } = await context.supabase
      .from("story_views")
      .select("viewer_id, created_at")
      .eq("story_id", data.id)
      .order("created_at", { ascending: false })
      .limit(200);
    const ids = Array.from(new Set((views ?? []).map((v) => v.viewer_id)));
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids)
      : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    const { data: replies } = await context.supabase
      .from("story_replies")
      .select("id, sender_id, body, created_at")
      .eq("story_id", data.id)
      .order("created_at", { ascending: false })
      .limit(100);

    return {
      viewers: (views ?? []).map((v) => ({
        id: v.viewer_id,
        created_at: v.created_at,
        display_name: byId.get(v.viewer_id)?.display_name ?? "Crush member",
        avatar_url: byId.get(v.viewer_id)?.avatar_url ?? null,
      })),
      replies: (replies ?? []).map((r) => ({
        ...r,
        display_name: byId.get(r.sender_id)?.display_name ?? "Crush member",
      })),
    };
  });

export const replyToStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { id?: string; body?: string };
    const body = (x.body ?? "").trim().slice(0, 500);
    if (!body) throw new Error("Write a reply first");
    return { id: String(x.id ?? ""), body };
  })
  .handler(async ({ data, context }) => {
    const { data: story } = await context.supabase
      .from("stories")
      .select("author_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!story) throw new Error("Story is no longer available");
    if (story.author_id === context.userId) throw new Error("You can't reply to your own story");

    const { error } = await context.supabase
      .from("story_replies")
      .insert({ story_id: data.id, sender_id: context.userId, body: data.body });
    if (error) throw error;

    // Mirror into the DM thread so the host sees it in their inbox.
    await context.supabase.from("messages").insert({
      sender_id: context.userId,
      recipient_id: story.author_id,
      body: `↩️ Replied to your story: ${data.body}`,
    });
    return { ok: true };
  });

/** Signed URL for story media — only while the story is still live. */
export const signStoryMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const path = String((i as { path?: string })?.path ?? "").trim();
    if (!path || path.includes("..")) throw new Error("path required");
    return { path };
  })
  .handler(async ({ data, context }) => {
    const { data: story } = await context.supabase
      .from("stories")
      .select("id")
      .eq("media_path", data.path)
      .limit(1)
      .maybeSingle();
    if (!story) throw new Error("Not allowed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("profile-media")
      .createSignedUrl(data.path, 60 * 60);
    if (error) throw error;
    return { url: signed.signedUrl };
  });
