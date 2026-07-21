import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function makeCode(len = 8) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function assertHost(ctx: { supabase: any; userId: string }) {
  const { data: profile } = await ctx.supabase
    .from("profiles").select("account_type").eq("id", ctx.userId).maybeSingle();
  if (!profile || profile.account_type !== "host") throw new Error("Hosts only");
}

export const hostCreateInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { label?: string; max_uses?: number | null; expires_days?: number | null };
    return {
      label: (x.label ?? "").trim().slice(0, 80) || null,
      max_uses: x.max_uses && x.max_uses > 0 ? Math.min(10000, Math.floor(x.max_uses)) : null,
      expires_days: x.expires_days && x.expires_days > 0 ? Math.min(365, Math.floor(x.expires_days)) : null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertHost(context);
    const expires_at = data.expires_days
      ? new Date(Date.now() + data.expires_days * 86400_000).toISOString()
      : null;
    // Retry on rare code collisions
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = makeCode(8);
      const { data: row, error } = await context.supabase
        .from("host_invites")
        .insert({
          host_id: context.userId,
          code,
          label: data.label,
          max_uses: data.max_uses,
          expires_at,
        })
        .select("*")
        .single();
      if (!error) return row;
      if (!String(error.message ?? "").toLowerCase().includes("duplicate")) throw error;
    }
    throw new Error("Could not generate a unique code, please retry");
  });

export const hostListInvites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertHost(context);
    const { data, error } = await context.supabase
      .from("host_invites")
      .select("*")
      .eq("host_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const hostToggleInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { id: string; active: boolean };
    if (!x.id) throw new Error("id required");
    return { id: x.id, active: !!x.active };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("host_invites")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("host_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const hostDeleteInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { id: string };
    if (!x.id) throw new Error("id required");
    return { id: x.id };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("host_invites")
      .delete()
      .eq("id", data.id)
      .eq("host_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const previewInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { code: string };
    return { code: String(x.code ?? "").trim().toUpperCase() };
  })
  .handler(async ({ data }) => {
    if (!data.code) return { ok: false as const, error: "invalid_code" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv } = await supabaseAdmin
      .from("host_invites")
      .select("host_id, label, expires_at, max_uses, uses, active")
      .eq("code", data.code)
      .maybeSingle();
    if (!inv || !inv.active) return { ok: false as const, error: "invalid_code" };
    const { data: host } = await supabaseAdmin
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", inv.host_id)
      .maybeSingle();
    return { ok: true as const, invite: inv, host };
  });


export const redeemInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const x = (i ?? {}) as { code: string };
    return { code: String(x.code ?? "").trim().toUpperCase() };
  })
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("redeem_host_invite", {
      _code: data.code,
    });
    if (error) throw error;
    return result as { ok: boolean; error?: string; host_id?: string };
  });
