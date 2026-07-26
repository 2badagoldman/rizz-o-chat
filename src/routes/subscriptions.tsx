import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { cancelSubscription, resumeSubscription } from '@/lib/subscriptions.functions';
import { createPortalSession } from '@/utils/payments.functions';
import { CreditCard, ExternalLink, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute('/subscriptions')({
  head: () => pageHead({
    path: "/subscriptions",
    title: "My subscriptions \u2014 Rizz Social",
    description: "Manage your Friends List memberships and Rizz Gold subscription on Rizz Social.",
  }) ?? []);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: '/auth' });
    if (user) load();
  }, [user, authLoading, load, navigate]);

  const onCancel = async (id: string) => {
    setBusy(id);
    const res = await cancelSubscription({ data: { subscriptionId: id, environment: getStripeEnvironment() } });
    setBusy(null);
    if ('error' in res) return toast.error(res.error);
    toast.success('Will cancel at period end.');
    load();
  };
  const onResume = async (id: string) => {
    setBusy(id);
    const res = await resumeSubscription({ data: { subscriptionId: id, environment: getStripeEnvironment() } });
    setBusy(null);
    if ('error' in res) return toast.error(res.error);
    toast.success('Subscription resumed.');
    load();
  };
  const onPortal = async () => {
    const res = await createPortalSession({
      data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
    });
    if ('error' in res) return toast.error(res.error);
    window.open(res.url, '_blank');
  };

  return (
    <AppShell>
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Billing</p>
        <h1 className="mt-1 text-2xl font-bold">My subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cancel any subscription at period end, or manage cards & invoices.</p>
      </header>

      <button onClick={onPortal} className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left">
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></span>
          <span>
            <p className="text-sm font-semibold">Manage billing</p>
            <p className="text-xs text-muted-foreground">Update card, view invoices, download receipts</p>
          </span>
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </button>

      {rows === null ? (
        <p className="pt-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-sm">No active subscriptions yet.</p>
          <Link to="/upgrade" className="btn-brand mt-3 inline-flex">Explore Rizz Gold</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const isFriends = !!r.host_id;
            const name = isFriends ? 'Friends List' : (LABEL[r.price_id] ?? r.price_id);
            const pill = statusPill(r.status);
            const endsAt = r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : '—';
            const willCancel = r.cancel_at_period_end;
            const canManage = r.status !== 'canceled';
            return (
              <li key={r.stripe_subscription_id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {willCancel ? `Access until ${endsAt}` : `Renews ${endsAt}`}
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] ${pill.cls}`}>{pill.text}</span>
                  </div>
                  {canManage ? (
                    willCancel ? (
                      <button
                        disabled={busy === r.stripe_subscription_id}
                        onClick={() => onResume(r.stripe_subscription_id)}
                        className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-primary/10 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Resume
                      </button>
                    ) : (
                      <button
                        disabled={busy === r.stripe_subscription_id}
                        onClick={() => onCancel(r.stripe_subscription_id)}
                        className="flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" /> Cancel
                      </button>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
