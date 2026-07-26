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

export const Route = createFileRoute('/subscriptions')({
  head: () => ({
    meta: [
      { title: 'My subscriptions — Rizz Social' },
      { name: 'description', content: 'Manage your Friends List memberships and Rizz Gold subscription on Rizz Social.' },
      { property: 'og:title', content: 'My subscriptions — Rizz Social' },
      { property: 'og:url', content: 'https://rizzlachat.com/subscriptions' },
    ],
    links: [{ rel: 'canonical', href: 'https://rizzlachat.com/subscriptions' }],
  }),

  component: SubscriptionsPage,
});

type Row = {
  stripe_subscription_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  host_id: string | null;
};

const LABEL: Record<string, string> = {
  rizz_gold_weekly: 'Rizz Gold',
  rizz_diamond_weekly: 'Rizz Diamond VIP',
  rizz_plus_monthly: 'Rizz Gold',
  rizz_vip_monthly: 'Rizz VIP',
};

function statusPill(s: string) {
  if (s === 'active' || s === 'trialing') return { text: 'Active', cls: 'bg-emerald-500/10 text-emerald-600' };
  if (s === 'past_due') return { text: 'Payment failed', cls: 'bg-amber-500/10 text-amber-600' };
  if (s === 'canceled') return { text: 'Canceled', cls: 'bg-muted text-muted-foreground' };
  return { text: s, cls: 'bg-muted text-muted-foreground' };
}

function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const env = getStripeEnvironment();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id,price_id,status,current_period_end,cancel_at_period_end,host_id')
      .eq('user_id', user.id)
      .eq('environment', env)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
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
