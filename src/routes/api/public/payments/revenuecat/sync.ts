import { createFileRoute } from "@tanstack/react-router";
import { revenueCatSyncBody, verifiedRevenueCatSubscriptions } from "@/lib/revenuecat-sync";

// The native shell loads this origin. Only its www alias needs cross-origin CORS.
function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({ Vary: "Origin", "Cache-Control": "no-store" });
  if (origin === "https://rizzlachat.com" || origin === "https://www.rizzlachat.com") {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
  return headers;
}

export const Route = createFileRoute("/api/public/payments/revenuecat/sync")({
  server: { handlers: {
    OPTIONS: ({ request }) => new Response(null, { status: 204, headers: corsHeaders(request) }),
    POST: async ({ request }) => {
      const headers = corsHeaders(request);
      const respond = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers });
      const { requireAuthedUser } = await import("@/lib/api-auth.server");
      const auth = await requireAuthedUser(request);
      if (auth instanceof Response) return respond({ error: "Authentication required" }, auth.status);
      let body: unknown;
      try { body = await request.json(); } catch { return respond({ error: "Invalid JSON" }, 400); }
      const parsed = revenueCatSyncBody.safeParse(body);
      if (!parsed.success) return respond({ error: "Invalid sync request" }, 400);
      if (parsed.data.userId !== auth.userId) return respond({ error: "Account mismatch" }, 403);

      const key = process.env.REVENUECAT_SECRET_API_KEY;
      if (!key) return respond({ error: "Store verification unavailable" }, 503);
      try {
        // Ignore client entitlement hints: only RevenueCat's authenticated snapshot authorizes access.
        const result = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(auth.userId)}`, {
          headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });
        if (!result.ok) return respond({ error: "Store verification unavailable" }, 502);
        const verified = verifiedRevenueCatSubscriptions(await result.json());
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: existing, error: readError } = await supabaseAdmin.from("subscriptions")
          .select("id, provider, product_id, price_id, status, current_period_end, environment")
          .eq("user_id", auth.userId);
        if (readError) throw readError;
        const now = Date.now();
        const tiers: Array<"plus" | "vip"> = verified.filter((sub) => sub.active).map((sub) => sub.tier);
        for (const row of existing ?? []) {
          if (row.provider !== "revenuecat") {
            if (["active", "trialing", "past_due"].includes(row.status) && row.current_period_end && Date.parse(row.current_period_end) > now) {
              if (row.price_id === "rizz_diamond_weekly") tiers.push("vip");
              else if (row.price_id === "rizz_gold_weekly") tiers.push("plus");
            }
            continue;
          }
          const sub = verified.find((item) => item.productId === row.product_id && item.environment === row.environment);
          // Only reconcile known subscription products; never touch consumables or unrelated plans.
          if (!sub) continue;
          const { error } = await supabaseAdmin.from("subscriptions").update({
            status: sub.active ? "active" : "canceled",
            current_period_start: sub.started,
            current_period_end: sub.expires,
            cancel_at_period_end: sub.cancelAtPeriodEnd,
            updated_at: new Date().toISOString(),
          }).eq("id", row.id).eq("user_id", auth.userId).eq("provider", "revenuecat");
          if (error) throw error;
        }
        const tier = tiers.includes("vip") ? "vip" : tiers.includes("plus") ? "plus" : "free";
        const { error } = await supabaseAdmin.from("profiles").update({ platform_tier: tier }).eq("id", auth.userId);
        if (error) throw error;
        // Webhooks own new transaction rows and coin grants, including Diamond renewal drops.
        return respond({ synced: true });
      } catch {
        return respond({ error: "Store sync unavailable; purchase webhook will retry independently" }, 502);
      }
    },
  } },
});