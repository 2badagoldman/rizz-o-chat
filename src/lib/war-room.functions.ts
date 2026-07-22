import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWarRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { hours?: number };
    const h = typeof i.hours === "number" && i.hours > 0 && i.hours <= 720 ? i.hours : 24;
    return { hours: h };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: metrics, error } = await supabase.rpc("war_room_metrics", { _hours: data.hours });
    if (error) throw error;
    return JSON.parse(JSON.stringify(metrics ?? {})) as {
      window_hours?: number;
      server_time?: string;
      active_now?: number;
      signed_in_now?: number;
      sessions?: number;
      users?: number;
      new_visitors?: number;
      returning_visitors?: number;
      pageviews?: number;
      events?: number;
      avg_session_seconds?: number;
      active_paths?: Array<{ path: string; sessions: number }>;
      top_pages?: Array<{ path: string; views: number; sessions: number }>;
      top_referrers?: Array<{ referrer: string; sessions: number }>;
      top_sources?: Array<{ source: string; sessions: number }>;
      devices?: Record<string, number>;
      countries?: Record<string, number>;
      timeseries?: Array<{ bucket: string; pageviews: number; sessions: number }>;
      top_events?: Array<{ event_type: string; ct: number }>;
      live_feed?: Array<{
        created_at: string;
        event_type: string;
        path: string | null;
        device: string;
        country: string;
        referrer: string;
        user_name: string | null;
      }>;
      demographics?: { gender?: Record<string, number>; account_type?: Record<string, number> };
    };
  });

export const adminCopilotChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { messages?: Array<{ role: string; content: string }> };
    if (!Array.isArray(i.messages) || i.messages.length === 0) throw new Error("messages required");
    return { messages: i.messages.slice(-20) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // Pull a fresh 24h snapshot as grounding for the copilot.
    const { data: snapshot } = await supabase.rpc("war_room_metrics", { _hours: 24 });

    const system = [
      "You are Rizzla Admin Copilot — the operator-side AI for the Rizzla dating/chat app.",
      "You help the admin (owner) understand traffic, engagement, demographics, revenue, and host performance,",
      "and you draft copy, feature briefs, promo slides, SQL insights, and moderation guidance on request.",
      "Be concise, direct, action-oriented. Use short bullet lists. Never invent numbers — quote only the JSON snapshot below.",
      "Live 24h snapshot JSON:",
      JSON.stringify(snapshot ?? {}),
    ].join("\n");

    const body = {
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        ...data.messages,
      ],
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
