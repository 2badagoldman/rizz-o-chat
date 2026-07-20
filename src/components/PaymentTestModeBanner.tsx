const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-xs text-red-800">
        Production checkout isn't configured yet. Complete Stripe go-live in Payments to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith('pk_test_')) {
    return (
      <div className="w-full bg-pink-100 border-b border-pink-200 px-4 py-2 text-center text-[11px] text-pink-800">
        Preview checkout is in <b>test mode</b>. Use card <b>4242 4242 4242 4242</b>, any future date, any CVC.
      </div>
    );
  }
  return null;
}
