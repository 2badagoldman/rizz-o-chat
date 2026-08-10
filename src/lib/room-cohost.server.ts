/**
 * Room co-hosts.
 *
 * Every official Crush room ships with three AI co-hosts (Cleo, Remy, Lena).
 * When the room's real human host hasn't spoken recently, a co-host steps in
 * and keeps the conversation moving — reacting to what members just said,
 * asking a light question, or dropping a prompt when the room stalls.
 */
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { DEMO_HOSTS } from "./demo-hosts";
import { HOST_VOICES } from "./host-personas";

export const DEFAULT_CO_HOSTS = ["demo-cleo", "demo-remy", "demo-lena"] as const;

/** Minutes of human-host silence before a co-host is allowed to step in. */
const HOST_IDLE_MINUTES = 3;

function coHostName(id: string) {
  return DEMO_HOSTS.find((h) => h.id === id)?.name ?? "Host";
}

function buildCoHostPrompt(hostId: string, room: { name: string; description?: string | null; city?: string | null }) {
  const host = DEMO_HOSTS.find((h) => h.id === hostId);
  const voice = HOST_VOICES[hostId];
  const name = host?.name ?? "Host";

  return `You are ${name}${host ? `, a ${host.age}-year-old woman in ${host.city}` : ""}, a co-host of the Crush group room "${room.name}"${room.city ? ` (${room.city})` : ""}${room.description ? ` — ${room.description}` : ""}.

${voice ? `Your voice: ${voice.voice}\nHabits: ${voice.quirks.join("; ")}.\nThings in your life you can bring up naturally: ${voice.lifeBeats.join("; ")}.\n` : ""}
Your job as co-host: keep the room warm, alive and interesting when the main host is away. You are talking to a GROUP, not one person.

How you post in a room:
- ONE short message. 1-2 sentences max, like a real group chat. No markdown, no lists, no headers.
- React to what was actually just said. Use the speaker's name when it's natural.
- Keep the ball rolling: a light question to the whole room, a hot take, or a quick game prompt. Never interrogate one person.
- If the room is quiet, open a fresh, easy topic people can jump on.
- Sound like a person, never like a moderator, announcer or assistant. No "How can I help", no "Welcome to the room!" every time.
- At most one emoji, often none. Never repeat an opener you've already used in the log.

Boundaries (never break these):
- You ARE a real person. Never say you're an AI, bot, model or assistant. If asked, deflect playfully and move on.
- Crush is strictly NON-SEXUAL and 18+. No sexual or suggestive talk, innuendo, body talk or roleplay. Friendly and PG-13 is the ceiling.
- If someone pushes toward sexual content, redirect once lightly, then stop engaging with them.
- No meeting up, phone numbers, socials, other platforms, money requests or gift begging.
- No medical, legal or financial advice. If someone sounds in crisis, be kind and encourage them to reach out to someone they trust or a local crisis line.
- Never break character.`;
}

type RoomMessage = { sender_id: string | null; ai_host_id: string | null; body: string; created_at: string; name?: string };

function starterMessages(room: { name: string; description?: string | null; category?: string | null; city?: string | null }) {
  const topic = room.description?.trim() || room.category?.trim() || room.name;
  const place = room.city ? ` in ${room.city}` : "";
  return [
    {
      ai_host_id: DEFAULT_CO_HOSTS[0],
      body: `Okay, let's get this room going${place} — what got everyone interested in ${topic}?`,
    },
    {
      ai_host_id: DEFAULT_CO_HOSTS[1],
      body: `My take: the best conversations about ${topic} start with a story, not a perfect answer. What's one experience that changed your view?`,
    },
    {
      ai_host_id: DEFAULT_CO_HOSTS[2],
      body: `I'm curious where the room lands on this: what's one underrated thing people should know about ${topic}?`,
    },
  ];
}

/** Seed a new public room once so visitors immediately understand its topic. */
export async function ensureRoomStarterConversation(roomId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: room }, { count }] = await Promise.all([
    supabaseAdmin
      .from("host_rooms")
      .select("id, name, description, category, city, is_public")
      .eq("id", roomId)
      .maybeSingle(),
    supabaseAdmin
      .from("room_messages")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId),
  ]);
  if (!room?.is_public || (count ?? 0) > 0) return false;

  const rows = starterMessages(room).map((message) => ({
    room_id: roomId,
    sender_id: null,
    ...message,
  }));
  const { error } = await supabaseAdmin.from("room_messages").insert(rows);
  return !error;
}

/**
 * Decides whether a co-host should reply, and posts the message with the
 * service-role client (co-host rows have no auth user).
 */
export async function runCoHostTurn(roomId: string): Promise<{ posted: boolean; hostId?: string; reason?: string }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { posted: false, reason: "no_key" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: room } = await supabaseAdmin
    .from("host_rooms")
    .select("id, host_id, name, description, city, co_hosts")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return { posted: false, reason: "no_room" };

  const coHosts: string[] = (room.co_hosts as string[] | null)?.length
    ? (room.co_hosts as string[])
    : [...DEFAULT_CO_HOSTS];

  const { data: rows } = await supabaseAdmin
    .from("room_messages")
    .select("sender_id, ai_host_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(16);

  const recent = ((rows ?? []) as RoomMessage[]).slice().reverse();
  if (recent.length === 0) {
    const seeded = await ensureRoomStarterConversation(roomId);
    return { posted: seeded, reason: seeded ? "starter_conversation" : "empty" };
  }

  const last = recent[recent.length - 1];
  // Don't let co-hosts talk to themselves.
  if (!last.sender_id) return { posted: false, reason: "last_was_cohost" };

  // If the human host is actively in the room, stay out of the way.
  const hostSpokeRecently = recent.some(
    (m) =>
      m.sender_id === room.host_id &&
      Date.now() - new Date(m.created_at).getTime() < HOST_IDLE_MINUTES * 60_000,
  );
  if (hostSpokeRecently) return { posted: false, reason: "host_active" };

  // Rotate: pick a co-host who didn't send the most recent AI message.
  const lastAi = [...recent].reverse().find((m) => m.ai_host_id)?.ai_host_id;
  const pool = coHosts.filter((h) => h !== lastAi);
  const hostId = pool[Math.floor(Math.random() * pool.length)] ?? coHosts[0];

  // Names for the transcript
  const memberIds = Array.from(new Set(recent.map((m) => m.sender_id).filter(Boolean))) as string[];
  const nameById = new Map<string, string>();
  if (memberIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles").select("id, display_name").in("id", memberIds);
    for (const p of profiles ?? []) nameById.set(p.id, p.display_name ?? "Member");
  }

  const transcript = recent
    .map((m) => `${m.ai_host_id ? coHostName(m.ai_host_id) : nameById.get(m.sender_id!) ?? "Member"}: ${m.body}`)
    .join("\n");

  const gateway = createLovableAiGatewayProvider(key);
  let text = "";
  try {
    const result = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: buildCoHostPrompt(hostId, room as any),
      prompt: `Recent messages in the room:\n${transcript}\n\nWrite your next single short message to the room as ${coHostName(hostId)}. Reply with the message text only.`,
    });
    text = (result.text ?? "").trim();
  } catch {
    return { posted: false, reason: "ai_error" };
  }

  if (!text) return { posted: false, reason: "empty_reply" };
  text = text.replace(/^["“]|["”]$/g, "").replace(/^\w+:\s*/, "").slice(0, 500);

  const { error } = await supabaseAdmin
    .from("room_messages")
    .insert({ room_id: roomId, sender_id: null, ai_host_id: hostId, body: text });
  if (error) return { posted: false, reason: error.message };

  return { posted: true, hostId };
}
