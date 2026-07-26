import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/legal/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Payment Terms — Rizzla Chat" },
      {
        name: "description",
        content:
          "Rizzla Chat billing terms: prices in USD, coin packs and memberships, automatic renewals, taxes, card statement descriptor, receipts, failed payments and secure card handling via Stripe.",
      },
      { property: "og:title", content: "Billing & Payment Terms — Rizzla Chat" },
      { property: "og:description", content: "Pricing, taxes, renewals, receipts and how card payments are secured." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://rizzlachat.com/legal/billing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/legal/billing" }],
  }),
  component: Billing,
});

function Billing() {
  return (
    <LegalDoc
      title="Billing & Payment Terms"
      subtitle={`How pricing, taxes, renewals and receipts work when you pay ${LEGAL.entity} for Rizzla products.`}
    >
      <Section heading="1. Merchant of record">
        <p>
          {LEGAL.entity} ({LEGAL.address}) is the merchant of record for every purchase. Card payments are processed by
          Stripe. Your card details are entered directly into Stripe's PCI-DSS compliant checkout and are never stored on
          our servers.
        </p>
        <p>
          Your statement will show <b className="text-foreground">{LEGAL.statementDescriptor}</b>. If you see a charge you
          do not recognise, email {LEGAL.supportEmail} before disputing it with your bank.
        </p>
      </Section>

      <Section heading="2. What we sell">
        <Bullets
          items={[
            <>
              <b className="text-foreground">Coin packs</b> — one-time purchases of in-app coins used for gifts, tips and
              unlocks. Coins are credited to your wallet immediately after payment.
            </>,
            <>
              <b className="text-foreground">Rizz Gold and Rizz Diamond VIP</b> — weekly platform memberships with perks such as
              boosted visibility and coin drops.
            </>,
            <>
              <b className="text-foreground">Friends List memberships</b> — monthly subscriptions to an individual Host's
              private list, priced by that Host within limits we set.
            </>,
            <>
              <b className="text-foreground">Tips</b> — one-time, variable-amount payments to a Host.
            </>,
          ]}
        />
        <p>All products are digital and delivered instantly in-app. No physical goods are shipped.</p>
      </Section>

      <Section heading="3. Prices, currency and taxes">
        <Bullets
          items={[
            `All prices are displayed and charged in ${LEGAL.currency}.`,
            "The exact total, including any sales tax, VAT or GST, is shown on the checkout screen before you confirm.",
            "Tax is determined by your billing location and calculated at checkout by our payment provider.",
            "Your bank may apply currency conversion or foreign transaction fees that we do not control or receive.",
            "We may change prices for future purchases and renewals; you will be notified at least 14 days before a renewal price change and can cancel beforehand.",
          ]}
        />
      </Section>

      <Section heading="4. Authorisation and renewals">
        <Bullets
          items={[
            "By completing checkout you authorise us and our payment provider to charge your selected payment method for the amount shown.",
            "Subscriptions renew automatically at the stated interval and price until cancelled. The next renewal date is always shown on your subscriptions page.",
            "You may cancel at any time; access continues until the end of the paid period. See our Refund & Cancellation Policy.",
            "Strong Customer Authentication (3-D Secure) may be requested by your bank; the payment completes only after you approve it.",
          ]}
        />
      </Section>

      <Section heading="5. Receipts and invoices">
        <p>
          A receipt is emailed for every successful charge. Full invoice history, PDF downloads and card management are
          available in the secure billing portal linked from your subscriptions page. Contact support if you need an
          invoice reissued with company details for expensing.
        </p>
      </Section>

      <Section heading="6. Failed payments">
        <Bullets
          items={[
            "If a renewal fails, we retry over several days and show a payment-failed banner in the app.",
            "Access continues during the retry window for the period already paid.",
            "If collection still fails, the subscription cancels automatically. No penalty or late fee is charged.",
            "Update your card in the billing portal to restore a paused membership.",
          ]}
        />
      </Section>

      <Section heading="7. Coins are not stored value">
        <p>
          Coins are a licence to access digital features, not money, deposits, e-money or a gift card. They cannot be
          withdrawn, resold, transferred between accounts, or exchanged for cash, and they earn no interest. Unused coins
          may be refunded only as described in the Refund & Cancellation Policy.
        </p>
      </Section>

      <Section heading="8. Fraud prevention and compliance">
        <Bullets
          items={[
            "Prices, entitlements and coin balances are validated server-side; client-supplied amounts are never trusted.",
            "Payment confirmations arrive through signature-verified webhooks and are processed once, idempotently.",
            "We screen for stolen cards, card testing, coin resale and chargeback abuse, and may block or refund suspicious transactions.",
            "We may request identity or age verification before releasing large purchases, payouts, or after a dispute.",
          ]}
        />
      </Section>

      <Section heading="9. Contact">
        <p>
          Billing questions:{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          — replies within {LEGAL.supportResponseHours} hours. {LEGAL.entity}, {LEGAL.address}.
        </p>
      </Section>
    </LegalDoc>
  );
}
