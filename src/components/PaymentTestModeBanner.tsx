const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/15 px-4 py-2 text-center text-xs font-medium text-foreground backdrop-blur-xl">
        Production checkout isn't configured yet. Complete Stripe go-live in Payments to accept real
        payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-border/60 bg-card/60 px-4 py-2 text-center text-[11px] font-medium text-muted-foreground backdrop-blur-xl">
        Preview checkout is in <b>test mode</b>. Use card <b>4242 4242 4242 4242</b>, any future
        date, any CVC.
      </div>
    );
  }
  return null;
}
