import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Runtime secrets this app reads. Values are NEVER returned — only presence.
 */
const RUNTIME_SECRETS: ReadonlyArray<{ name: string; purpose: string; managed?: boolean }> = [
  { name: "LOVABLE_API_KEY", purpose: "AI Gateway (Rizz Wizard, moderation, AI creators) + connectors", managed: true },
  { name: "STRIPE_LIVE_API_KEY", purpose: "Live payments (coins, Gold, Diamond)", managed: true },
  { name: "STRIPE_SANDBOX_API_KEY", purpose: "Sandbox payments for testing", managed: true },
  { name: "PAYMENTS_LIVE_WEBHOOK_SECRET", purpose: "Verifies live payment webhooks", managed: true },
  { name: "PAYMENTS_SANDBOX_WEBHOOK_SECRET", purpose: "Verifies sandbox payment webhooks", managed: true },
  { name: "ADMIN_BOOTSTRAP_SECRET", purpose: "One-time admin role bootstrap" },
  { name: "OPS_CRON_SECRET", purpose: "Auth for the ops/managers maintenance cron hook" },
  { name: "SHOWCASE_CRON_SECRET", purpose: "Auth for the showcase refresh cron hook" },
];

export const listRuntimeSecrets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden — admin only");

    return RUNTIME_SECRETS.map((s) => ({
      name: s.name,
      purpose: s.purpose,
      managed: Boolean(s.managed),
      configured: Boolean(process.env[s.name]),
    }));
  });
