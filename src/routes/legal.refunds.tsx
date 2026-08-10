import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/refunds")({
  head: () => pageHead({
    path: "/legal/refunds",
    title: "Refund & Cancellation Policy \u2014 Crush Chat",
    description: "Crush Chat refund and cancellation policy: 14-day refunds on unused coins and memberships, how to cancel a subscription, how tips and spent coins are treated, and how to reach support.",
    type: "article",
  }),
  component: Refunds,
});

function Refunds() {
  return (
    <LegalDoc
      title="Refund & Cancellation Policy"
      subtitle="Short version: unused coins and unused membership time can be refunded within 14 days. Coins you have already spent, and gifts or tips already delivered, are final."
    >
      <Section heading="1. Cancel any time, in two clicks">
        <Bullets
          items={[
            <>
              Open <Link to="/subscriptions" className="font-semibold text-primary">My subscriptions</Link> and tap
              <b className="text-foreground"> Cancel</b>. Your membership stays active until the end of the period you already
              paid for, then stops. You can tap <b className="text-foreground">Resume</b> before that date to keep it.
            </>,
            <>
              You can also manage cards, invoices and cancellations in the secure billing portal linked from the same page.
            </>,
            "We never charge a cancellation fee, and cancelling never deletes your account, chats or coins.",
            <>
              Need help? Email{" "}
              <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
                {LEGAL.supportEmail}
              </a>{" "}
              and we will cancel it for you within {LEGAL.supportResponseHours} hours.
            </>,
          ]}
        />
      </Section>

      <Section heading={`2. Refund window — ${LEGAL.refundWindowDays} days`}>
        <p>
          If you contact us within {LEGAL.refundWindowDays} days of a charge, we refund it in full to the original payment
          method when the purchase is unused:
        </p>
        <Bullets
          items={[
            "Coin packs where the coins are still in your wallet and none from that pack have been spent.",
            "A membership (Crush Gold, Crush Diamond VIP or a Creator's Friends List) where you have not used the paid features — no gated media viewed, no member-only chat sent.",
            "Duplicate charges, failed deliveries, or coins that were paid for but not credited — refunded in full regardless of the window.",
            "Charges you did not authorise, once verified — refunded in full and the account secured.",
          ]}
        />
        <p>
          Where consumer law in your country gives you a stronger right of withdrawal, that law applies and overrides this
          section.
        </p>
      </Section>

      <Section heading="3. What is not refundable">
        <Bullets
          items={[
            "Coins that have already been spent on gifts, tips, unlocks or premium chat — the digital item was delivered and consumed immediately.",
            "Gifts and tips sent to a Host. These are voluntary, instant transfers to a creator and cannot be reversed.",
            "Membership periods you have already used, and partial or unused days after a mid-period cancellation (access continues to the period end instead).",
            "Purchases on accounts terminated for fraud, chargeback abuse, coin resale, or violations of our Acceptable Use & Content Policy.",
            "Requests made more than " + LEGAL.refundWindowDays + " days after the charge, unless required by law or the charge was unauthorised.",
          ]}
        />
        <p>
          We may still grant a goodwill refund outside these rules at our discretion — always ask, we would rather fix the
          problem than lose you.
        </p>
      </Section>

      <Section heading="4. Automatic renewals">
        <Bullets
          items={[
            "Memberships renew automatically at the interval and price shown at checkout until you cancel.",
            "The renewal date and amount are always visible on the My subscriptions page, and a receipt is emailed for every charge.",
            "Cancel before the renewal date to avoid the next charge. If a renewal charges within 24 hours of your cancellation attempt, contact us and we will refund it.",
            "If a payment fails, we retry a few times; the membership pauses and then cancels if it cannot be collected. You keep access until the paid period ends.",
          ]}
        />
      </Section>

      <Section heading="5. How to request a refund">
        <Bullets
          items={[
            <>
              Email{" "}
              <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
                {LEGAL.supportEmail}
              </a>{" "}
              from your account email address.
            </>,
            "Include the date, amount and what you bought (the receipt number helps).",
            `We reply within ${LEGAL.supportResponseHours} hours and, when approved, issue the refund immediately.`,
            "Refunds land back on the original card or wallet, typically within 5–10 business days depending on your bank.",
          ]}
        />
      </Section>

      <Section heading="6. Chargebacks — please talk to us first">
        <p>
          Our support is faster than a bank dispute. If you open a chargeback before contacting us, the account is
          suspended while the dispute is investigated, and we will provide the payment provider with the transaction,
          delivery and usage records. Confirmed fraudulent disputes result in a permanent ban. Genuine mistakes are always
          refunded without argument.
        </p>
      </Section>

      <Section heading="7. Currency, statements and taxes">
        <p>
          All prices are in {LEGAL.currency}. Card statements show{" "}
          <b className="text-foreground">{LEGAL.statementDescriptor}</b>. Applicable sales tax, VAT or GST is calculated at
          checkout and refunded proportionally with any refund. Your bank's currency conversion or foreign transaction
          fees are set by your bank and are not refundable by us.
        </p>
      </Section>

      <Section heading="8. Contact">
        <p>
          {LEGAL.entity}, {LEGAL.address} —{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          .
        </p>
      </Section>
    </LegalDoc>
  );
}
