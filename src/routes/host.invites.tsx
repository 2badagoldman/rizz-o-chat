import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Link2, Trash2, Power, Plus } from "lucide-react";
import {
  hostCreateInvite,
  hostListInvites,
  hostToggleInvite,
  hostDeleteInvite,
} from "@/lib/host-invites.functions";

export const Route = createFileRoute("/host/invites")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Invite Friends Free — Rizzla" }] }),
  component: HostInvites,
});

type Invite = {
  id: string;
  code: string;
  label: string | null;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

function HostInvites() {
  const { user, loading } = useAuth();
  const create = useServerFn(hostCreateInvite);
  const list = useServerFn(hostListInvites);
  const toggle = useServerFn(hostToggleInvite);
  const remove = useServerFn(hostDeleteInvite);

  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Invite[]>([]);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresDays, setExpiresDays] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles").select("account_type").eq("id", user.id).maybeSingle();
      setIsHost(p?.account_type === "host");
      if (p?.account_type === "host") {
        const items = (await list()) as Invite[];
        setRows(items);
      }
    })();
  }, [loading, user, list]);

  const refresh = async () => setRows((await list()) as Invite[]);

  const onCreate = async () => {
    setBusy(true);
    try {
      await create({
        data: {
          label,
          max_uses: maxUses ? Number(maxUses) : null,
          expires_days: expiresDays ? Number(expiresDays) : null,
        },
      });
      setLabel(""); setMaxUses(""); setExpiresDays("");
      await refresh();
      toast.success("Invite link created");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create invite");
    } finally { setBusy(false); }
  };

  const inviteUrl = (code: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/invite/${code}` : `/invite/${code}`;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(code));
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed — long-press the link");
    }
  };

  const share = async (code: string) => {
    const url = inviteUrl(code);
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Join me on Rizzla", text: "Free access to my Friends List:", url });
        return;
      } catch {}
    }
    copy(code);
  };

  if (loading) return <AppShell><p className="p-6 text-muted-foreground">Loading…</p></AppShell>;
  if (!user) return <AppShell><p className="p-6">Please <Link to="/auth" className="underline">sign in</Link>.</p></AppShell>;
  if (isHost === false) return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl">Hosts only</h1>
        <p className="mt-2 text-muted-foreground">Apply as a host to generate free invite links for your friends.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="px-4 pt-4">
        <div className="rounded-3xl p-5 text-white shadow-glow" style={{ background: "var(--gradient-brand)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-90">Free invites</p>
          <h1 className="mt-1 text-2xl">Bring your girls in for free</h1>
          <p className="mt-1 text-sm opacity-90">
            Share your unique link. Anyone who signs up through it joins your Friends List free and lands straight in your chat.
          </p>
        </div>
      </div>

      <section className="mt-5 px-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Create a new invite</p>
          <div className="mt-3 grid gap-2">
            <input
              placeholder="Label (optional) — e.g. IG story, best friends"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number" min={1} placeholder="Max uses (blank = unlimited)"
                value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                type="number" min={1} placeholder="Expires in days (blank = never)"
                value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              disabled={busy}
              onClick={onCreate}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Plus className="h-4 w-4" /> Generate link
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 px-4 pb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your invites</p>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invites yet. Generate your first one above.</p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((r) => {
              const url = inviteUrl(r.code);
              const remaining = r.max_uses ? Math.max(0, r.max_uses - r.uses) : null;
              const expired = r.expires_at ? new Date(r.expires_at).getTime() < Date.now() : false;
              return (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.label || "Untitled invite"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Code <span className="font-mono font-semibold text-foreground">{r.code}</span> · {r.uses} used
                        {r.max_uses ? ` · ${remaining} left` : ""}
                        {r.expires_at ? ` · ${expired ? "expired" : `expires ${new Date(r.expires_at).toLocaleDateString()}`}` : ""}
                        {!r.active ? " · paused" : ""}
                      </p>
                      <p className="mt-2 break-all rounded-lg bg-muted px-2 py-1 font-mono text-[11px]">{url}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => copy(r.code)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                    <button onClick={() => share(r.code)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold">
                      <Link2 className="h-3.5 w-3.5" /> Share
                    </button>
                    <button
                      onClick={async () => { await toggle({ data: { id: r.id, active: !r.active } }); await refresh(); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold"
                    >
                      <Power className="h-3.5 w-3.5" /> {r.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this invite? Existing sign-ups keep their free membership.")) return;
                        await remove({ data: { id: r.id } });
                        await refresh();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
