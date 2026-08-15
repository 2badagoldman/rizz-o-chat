import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { previewInvite, redeemInvite } from "@/lib/host-invites.functions";
import { toast } from "sonner";
import { pageHead } from "@/lib/seo";
import rizzAiLogo from "@/assets/crush-logo.png.asset.json";

export const Route = createFileRoute("/invite/$code")({
  head: ({ params }) =>
    pageHead({
      path: `/invite/${params.code}`,
      title: "You're invited — Crush",
      description:
        "Someone saved you a free spot on their Crush Friends List. Open the invite to join the chat.",
      noindex: true,
    }),

  component: InvitePage,
});

const STORAGE_KEY = "rizzla:pendingInvite";

function InvitePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const preview = useServerFn(previewInvite);
  const redeem = useServerFn(redeemInvite);

  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "invalid"; msg: string }
    | { kind: "needs_auth"; creator: any }
    | { kind: "redeeming" }
    | { kind: "success"; hostId: string }
  >({ kind: "loading" });

  const normalized = (code ?? "").toUpperCase();

  // Persist code so it survives auth redirect / signup
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, normalized); } catch {}
  }, [normalized]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        // Preview requires auth (RLS). Skip preview and prompt sign-in.
        setState({ kind: "needs_auth", creator: null });
        return;
      }
      const pv: any = await preview({ data: { code: normalized } });
      if (cancelled) return;
      if (!pv?.ok) {
        setState({ kind: "invalid", msg: pv?.error ?? "invalid_code" });
        return;
      }
      setState({ kind: "redeeming" });
      const res: any = await redeem({ data: { code: normalized } });
      if (cancelled) return;
      if (!res?.ok) {
        setState({ kind: "invalid", msg: res?.error ?? "failed" });
        return;
      }
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      toast.success(`You're in ${pv.host?.display_name ? pv.host.display_name + "'s" : "the"} Friends List — free!`);
      setState({ kind: "success", hostId: res.host_id });
    })();
    return () => { cancelled = true; };
  }, [loading, user, normalized, preview, redeem]);

  return (
    <AppShell hideNav>
      <div className="px-4 pt-10 text-center">
        <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="Crush" className="mx-auto h-20 w-20 rounded-full shadow-glow" />
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">You're invited</p>
        <h1 className="mt-1 text-3xl">Free access to a Friends List</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invite code <span className="font-mono font-semibold text-foreground">{normalized}</span>
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-left">
          {state.kind === "loading" && <p className="text-sm text-muted-foreground">Checking your invite…</p>}
          {state.kind === "needs_auth" && (
            <>
              <p className="text-sm">Create your account or sign in — we'll drop you straight into the chat for free.</p>
              <Link
                to="/auth"
                search={{ next: `/invite/${normalized}` }}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                Sign up free to claim
              </Link>
            </>
          )}
          {state.kind === "redeeming" && <p className="text-sm text-muted-foreground">Adding you to the Friends List…</p>}
          {state.kind === "invalid" && (
            <>
              <p className="text-sm text-destructive">
                {state.msg === "expired" ? "This invite has expired." :
                 state.msg === "max_uses_reached" ? "This invite is fully used." :
                 state.msg === "cannot_invite_self" ? "You can't redeem your own invite." :
                 "This invite link is not valid."}
              </p>
              <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">Back to home →</Link>
            </>
          )}
          {state.kind === "success" && (
            <>
              <p className="text-sm">🎉 You're in! Start chatting now.</p>
              <button
                onClick={() => navigate({ to: "/chat/$hostId", params: { hostId: state.hostId } })}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                Open chat
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
