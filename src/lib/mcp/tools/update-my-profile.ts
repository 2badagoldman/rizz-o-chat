import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "update_my_profile",
  title: "Update my profile",
  description:
    "Update the signed-in user's Crush profile fields (display name, bio, interests).",
  inputSchema: {
    display_name: z.string().trim().min(1).max(60).optional().describe("New public display name."),
    bio: z.string().trim().max(500).optional().describe("Short bio shown on the profile."),
    interests: z.array(z.string().trim().min(1)).max(20).optional().describe("Interest tags."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const patch: Record<string, unknown> = {};
    if (input.display_name !== undefined) patch.display_name = input.display_name;
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.interests !== undefined) patch.interests = input.interests;
    if (Object.keys(patch).length === 0) {
      return { content: [{ type: "text", text: "No fields provided to update." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", ctx.getUserId())
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: "Profile updated." }],
      structuredContent: { profile: data },
    };
  },
});
