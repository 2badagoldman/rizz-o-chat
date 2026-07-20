import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/checkout/return')({
  head: () => ({ meta: [{ title: 'Payment complete — Rizzla' }] }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <AppShell hideDock>
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h1 className="text-2xl font-bold">You're all set!</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {session_id
            ? 'Your access is being unlocked right now. Coins, memberships, and Friends List access appear within a few seconds.'
            : 'We could not find your session details, but your payment may still be processing.'}
        </p>
        <div className="mt-4 flex gap-2">
          <Link to="/dashboard" className="btn-brand">Back to dashboard</Link>
          <Link to="/discover" className="rounded-2xl border border-border px-4 py-2 text-sm">Browse hosts</Link>
        </div>
      </div>
    </AppShell>
  );
}
