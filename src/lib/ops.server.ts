/**
 * Ops managers — small autonomous jobs that keep the app healthy.
 * Server-only: every function here uses the service role.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ManagerId =
  | "health"
  | "payments"
  | "compliance"
  | "content"
  | "engagement";

export type ManagerResult = {
  manager: ManagerId;
  status: "ok" | "warning" | "failed";
  summary: string;
  items: number;
  duration_ms: number;
  details: Record<string, unknown>;
};

export const MANAGERS: ReadonlyArray<{ id: ManagerId; label: string; blurb: string }> = [
  { id: "health", label: "Health Manager", blurb: "Database, auth, storage and AI reachability." },
  { id: "payments", label: "Payments Manager", blurb: "Reconciles checkouts, flags failed or stuck payments." },
  { id: "compliance", label: "Compliance Manager", blurb: "Tracks 18+ verification deadlines and overdue accounts." },
  { id: "content", label: "Content Janitor", blurb: "Clears expired stories and prunes old analytics." },
  { id: "engagement", label: "Engagement Manager", blurb: "Watches live stories, rooms and chat activity." },
];

type Admin = SupabaseClient<never, never, never>;

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

async function count(db: Admin, table: string, build: (q: never) => unknown): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = (db.from(table) as any).select("*", { count: "exact", head: true });
  const { count: c, error } = await (build as unknown as (x: unknown) => Promise<{ count: number | null; error: unknown }>)(q);
  if (error) throw error;
  return c ?? 0;
}

async function runHealth(db: Admin): Promise<Omit<ManagerResult, "manager" | "duration_ms">> {
  const checks: Record<string, string> = {};
  let bad = 0;

  try {
    await count(db, "profiles", (q) => q as never);
    checks.database = "ok";
  } catch (e) {
    checks.database = `failed: ${(e as Error).message}`;
    bad++;
  }

  try {
    const { error } = await db.storage.listBuckets();
    checks.storage = error ? `failed: ${error.message}` : "ok";
    if (error) bad++;
  } catch (e) {
    checks.storage = `failed: ${(e as Error).message}`;
    bad++;
  }

  checks.ai_gateway = process.env["LOVABLE_API_KEY"] ? "ok" : "missing key";
  if (!process.env["LOVABLE_API_KEY"]) bad++;

  checks.payments = process.env["STRIPE_LIVE_API_KEY"] || process.env["STRIPE_SANDBOX_API_KEY"] ? "ok" : "no key";
  if (checks.payments !== "ok") bad++;

  return {
    status: bad === 0 ? "ok" : bad > 1 ? "failed" : "warning",
    summary: bad === 0 ? "All systems reachable" : `${bad} subsystem${bad === 1 ? "" : "s"} need attention`,
    items: Object.keys(checks).length,
    details: checks,
  };
}

async function runPayments(db: Admin): Promise<Omit<ManagerResult, "manager" | "duration_ms">> {
  const since = iso(24 * 3600_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.from("payment_audit_log") as any)
    .select("status, kind, amount_cents, created_at")
    .gte("created_at", since)
    .limit(1000);
  if (error) throw error;

  const rows = (data ?? []) as Array<{ status: string; kind: string; amount_cents: number | null }>;
  const failed = rows.filter((r) => /fail|error|declin/i.test(r.status)).length;
  const pending = rows.filter((r) => /pending|open|created/i.test(r.status)).length;
  const succeeded = rows.length - failed - pending;
  const grossCents = rows
    .filter((r) => !/fail|error|declin/i.test(r.status))
    .reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);

  return {
    status: failed > 0 ? "warning" : "ok",
    summary:
      rows.length === 0
        ? "No payment activity in the last 24h"
        : `${succeeded} settled, ${pending} pending, ${failed} failed in 24h`,
    items: rows.length,
    details: { failed, pending, succeeded, gross_cents: grossCents },
  };
}

async function runCompliance(db: Admin): Promise<Omit<ManagerResult, "manager" | "duration_ms">> {
  const now = new Date().toISOString();
  const soon = new Date(Date.now() + 2 * 86400_000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles = db.from("profiles") as any;
  const [{ count: overdue }, { count: dueSoon }, { count: pending }] = await Promise.all([
    profiles.select("*", { count: "exact", head: true }).neq("kyc_status", "approved").lt("kyc_due_at", now).is("deleted_at", null),
    profiles.select("*", { count: "exact", head: true }).neq("kyc_status", "approved").gte("kyc_due_at", now).lte("kyc_due_at", soon).is("deleted_at", null),
    profiles.select("*", { count: "exact", head: true }).eq("kyc_status", "pending").is("deleted_at", null),
  ]);

  const over = overdue ?? 0;
  return {
    status: over > 0 ? "warning" : "ok",
    summary:
      over > 0
        ? `${over} account${over === 1 ? "" : "s"} past the 18+ deadline`
        : `All accounts inside the verification window`,
    items: over + (dueSoon ?? 0),
    details: { overdue: over, due_within_48h: dueSoon ?? 0, awaiting_review: pending ?? 0 },
  };
}

async function runContent(db: Admin): Promise<Omit<ManagerResult, "manager" | "duration_ms">> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stories = db.from("stories") as any;
  const { data: dead, error } = await stories
    .delete()
    .lt("expires_at", iso(2 * 86400_000))
    .select("id");
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = db.from("analytics_events") as any;
  const { data: pruned } = await events.delete().lt("created_at", iso(120 * 86400_000)).select("id");

  const removed = (dead?.length ?? 0) + (pruned?.length ?? 0);
  return {
    status: "ok",
    summary: removed === 0 ? "Nothing to clean up" : `Cleared ${removed} stale record${removed === 1 ? "" : "s"}`,
    items: removed,
    details: { expired_stories: dead?.length ?? 0, pruned_analytics: pruned?.length ?? 0 },
  };
}

async function runEngagement(db: Admin): Promise<Omit<ManagerResult, "manager" | "duration_ms">> {
  const dayAgo = iso(86400_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = (t: string) => db.from(t) as any;

  const [{ count: liveStories }, { count: rooms }, { count: msgs }, { count: signups }] = await Promise.all([
    any("stories").select("*", { count: "exact", head: true }).gt("expires_at", new Date().toISOString()),
    any("host_rooms").select("*", { count: "exact", head: true }),
    any("messages").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    any("profiles").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
  ]);

  const quiet = (msgs ?? 0) === 0;
  return {
    status: quiet ? "warning" : "ok",
    summary: quiet
      ? "No messages in the last 24h — the feed looks quiet"
      : `${msgs} messages, ${signups} new members in 24h`,
    items: msgs ?? 0,
    details: {
      live_stories: liveStories ?? 0,
      rooms: rooms ?? 0,
      messages_24h: msgs ?? 0,
      signups_24h: signups ?? 0,
    },
  };
}

const RUNNERS: Record<ManagerId, (db: Admin) => Promise<Omit<ManagerResult, "manager" | "duration_ms">>> = {
  health: runHealth,
  payments: runPayments,
  compliance: runCompliance,
  content: runContent,
  engagement: runEngagement,
};

/** Run one or more managers and record each outcome in ops_runs. */
export async function runManagers(
  db: Admin,
  ids: ManagerId[],
  trigger: "manual" | "schedule",
): Promise<ManagerResult[]> {
  const results: ManagerResult[] = [];

  for (const id of ids) {
    const started = Date.now();
    let out: ManagerResult;
    try {
      const r = await RUNNERS[id](db);
      out = { manager: id, duration_ms: Date.now() - started, ...r };
    } catch (e) {
      out = {
        manager: id,
        status: "failed",
        summary: (e as Error).message.slice(0, 300),
        items: 0,
        duration_ms: Date.now() - started,
        details: {},
      };
    }
    results.push(out);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("ops_runs") as any).insert({
      manager: out.manager,
      status: out.status,
      summary: out.summary,
      items: out.items,
      duration_ms: out.duration_ms,
      details: out.details,
      trigger,
    });
  }

  return results;
}
