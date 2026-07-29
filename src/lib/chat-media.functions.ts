import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns a short-lived signed URL for a chat attachment, but only to people
 * who are actually part of the conversation it was shared in.
 */
export const signChatMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = i as { path?: string };
    const path = (x?.path ?? "").trim();
    if (!path || path.includes("..")) throw new Error("path required");
    return { path };
  })
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const marker = `[[media:${data.path}|`;
    let allowed = data.path.startsWith(`${me}/`);

    if (!allowed) {
      // Shared with me in a direct message?
      const { data: dm } = await context.supabase
        .from("messages")
        .select("id")
        .like("body", `%${marker}%`)
        .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
        .limit(1);
      allowed = !!dm?.length;
    }

    if (!allowed) {
      // Shared in a room I belong to (RLS already scopes room_messages).
      const { data: rm } = await context.supabase
        .from("room_messages")
        .select("id")
        .like("body", `%${marker}%`)
        .limit(1);
      allowed = !!rm?.length;
    }

    if (!allowed) throw new Error("Not allowed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("chat-media")
      .createSignedUrl(data.path, 60 * 60);
    if (error) throw error;
    return { url: signed.signedUrl };
  });
