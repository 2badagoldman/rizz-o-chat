import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ChatAccess } from "@/lib/chat-access.server";

export const getChatAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatAccess> => {
    const { evaluateChatAccess } = await import("@/lib/chat-access.server");
    return evaluateChatAccess(context.userId);
  });
