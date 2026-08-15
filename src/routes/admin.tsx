import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  Crown,
  Wallet,
  Image as ImageIcon,
  ShieldAlert,
  Menu,
  X,
  Home,
  Inbox,
  Radio,
  Sparkles,
  ReceiptText,
  ClipboardList,
  Activity,
  KeyRound,
  Bug,
  Rocket,
  Link2,

} from "lucide-react";
import rizzAiLogo from "@/assets/crush-logo.png.asset.json";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Admin — Crush" }] }),
  component: AdminLayout,
});

const NAV: ReadonlyArray<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/ops", label: "Control Room", icon: Activity },
  { to: "/admin/war-room", label: "War Room", icon: Radio },
  { to: "/admin/growth-playbook", label: "250K MRR", icon: Rocket },
  { to: "/admin/creator-codes", label: "Creator Codes", icon: Link2 },

  { to: "/admin/copilot", label: "Copilot", icon: Sparkles },
  { to: "/admin/applications", label: "Creator Applications", icon: Crown },
  { to: "/admin/hosts", label: "Hosts", icon: Crown },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/kyc", label: "Age Verification", icon: ShieldAlert },
  { to: "/admin/reports", label: "Abuse Reports", icon: ShieldAlert },

  { to: "/admin/compliance", label: "Daily Report", icon: ClipboardList },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet },
  { to: "/admin/payments", label: "Payment Log", icon: ReceiptText },

  { to: "/admin/showcase", label: "Showcase", icon: ImageIcon },
  { to: "/admin/showcase-brain", label: "Showcase Brain", icon: Sparkles },
  { to: "/admin/early-access", label: "Waitlist", icon: Inbox },
  { to: "/admin/errors", label: "Error Tracking", icon: Bug },
  { to: "/admin/secrets", label: "Secret Manager", icon: KeyRound },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
      setChecking(false);
    })();
  }, [user]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (loading || checking) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading admin…</div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center max-w-sm">
          <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-xl">Sign in to view admin</h1>
          <Link to="/auth" className="btn-brand mt-5 inline-flex">Sign in</Link>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return <NotAdmin userId={user.id} onPromoted={() => setIsAdmin(true)} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-card transform transition-transform lg:translate-x-0 lg:static " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="" className="h-7 w-7 rounded-full" />
            <div>
              <p className="text-sm font-bold leading-tight">Crush Admin</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Master console</p>
            </div>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-gradient-brand-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          <div className="my-2 border-t border-border" />
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Back to app
          </Link>
        </nav>
      </aside>

      {open ? (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 backdrop-blur px-4 py-2.5 lg:px-6">
          <button
            className="lg:hidden rounded-lg border border-border p-1.5"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold">
            {NAV.find((n) => (n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/")))?.label ?? "Admin"}
          </h1>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotAdmin({ userId, onPromoted }: { userId: string; onPromoted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="rounded-2xl border border-border bg-card p-6 text-center max-w-sm">
        <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-lg font-semibold">Admin access required</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your account doesn't have admin access. Operators performing first-time
          setup can enter the setup key below.
        </p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Setup key"
          aria-label="Admin setup key"
          className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          disabled={busy || !secret}
          className="btn-brand mt-3 w-full disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const { grantAdminRole } = await import("@/lib/admin.functions");
              await grantAdminRole({ data: { targetUserId: userId, secret } });
              onPromoted();
            } catch {
              setErr("Setup key rejected.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : "Complete admin setup"}
        </button>
        {err ? <p className="mt-2 text-xs text-destructive">{err}</p> : null}
      </div>
    </div>
  );
}

