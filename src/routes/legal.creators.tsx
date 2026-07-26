import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/legal/creators")({
  head: () => ({
    meta: [
      { title: "Creator & Payout Terms — Rizzla Chat" },
      {
        name: "description",
        content:
          "Terms for Rizzla Chat Hosts: revenue split, Friends List pricing limits, payout schedule and thresholds, chargeback clawbacks, tax responsibility and content obligations.",
      },
      { property: "og:title", content: "Creator & Payout Terms — Rizzla Chat" },
      { property: "og:description", content: "Revenue split, payouts, clawbacks and Host obligations on Rizzla Chat." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://rizzlachat.com/legal/creators" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/legal/creators" }],
  }),
  component: Creators,
});

function Creators() {
  return (
    <LegalDoc
      title="Creator & Payout Terms"
      subtitle={`These terms apply if you are approved as a Host on ${LEGAL.productName}. They form part of our Terms of Service.`}
    >
      <Section heading="1. Independent creator status">
        <p>
          Hosts are independent creators. Nothing here creates an employment, partnership, agency or joint-venture
          relationship with {LEGAL.entity}. You control your own content, schedule and pricing within the limits below,
          and you are responsible for your own equipment, taxes and legal compliance.
        </p>
      </Section>

      <Section heading="2. Approval and verification">
        <Bullets
          items={[
            `Hosts must be ${LEGAL.minAge}+ and pass our review before their Friends List can be sold.`,
            "We may require identity and age verification, and may re-verify at any time.",
            "We may decline, pause or revoke Host status for policy violations, chargeback rates, fraud signals, or failed verification.",
          ]}
        />
      </Section>

      <Section heading="3. Pricing and platform fee">
        <Bullets
          items={[
            "You set your Friends List monthly price within the platform's allowed range, shown in your pricing screen with a live earnings preview.",
            "The standard revenue split starts at 35% to the Host; Hosts who reach 100 paying Friends move to 65% for the lifetime of the account, as displayed in-app.",
            "The split is applied to net revenue after refunds, chargebacks, and payment-processing and tax amounts collected by our provider.",
            "Complimentary members you add manually, and invite-link members, generate no subscription revenue.",
            "Tips and gifts are credited to your balance under the same split shown in your earnings screen at the time of the transaction.",
          ]}
        />
      </Section>

      <Section heading="4. Payouts">
        <Bullets
          items={[
            "Earnings accrue to your in-app balance as transactions clear.",
            "Payouts are reviewed and released on a rolling schedule after a holdback period that covers refund and chargeback risk.",
            "A minimum balance may apply before a payout is released; the current threshold is shown in your earnings screen.",
            "You must provide accurate payout details and any tax forms we are legally required to collect before funds can be released.",
            "We may delay a payout while investigating fraud, a dispute, a safety report, or an unverified account.",
          ]}
        />
      </Section>

      <Section heading="5. Refunds, chargebacks and clawbacks">
        <p>
          If a member's payment is refunded or charged back, the corresponding Host earnings are reversed from your
          balance. If your balance is insufficient, the amount offsets future earnings. Sustained high dispute rates may
          result in payout suspension or removal from the platform.
        </p>
      </Section>

      <Section heading="6. Content and conduct obligations">
        <Bullets
          items={[
            "You warrant that you own or license all content you upload and that every person in it is a consenting adult.",
            "You must follow the Acceptable Use & Content Policy in all chats, rooms and uploads.",
            "You must deliver what you advertise. Selling access and then failing to engage is grounds for refunds to members and enforcement against you.",
            "You must not move members off-platform to avoid fees, or request payments outside Rizzla.",
            "Admin staff may review your profile media, member chats and rooms for safety and dispute investigation.",
          ]}
        />
      </Section>

      <Section heading="7. Taxes">
        <p>
          You are solely responsible for reporting and paying all income, self-employment and other taxes on your Rizzla
          earnings. We may issue information returns (for example a US Form 1099) where required and will request the
          necessary tax details from you before payout.
        </p>
      </Section>

      <Section heading="8. Termination">
        <p>
          You may stop hosting at any time; members are notified and their renewals stop. On termination for policy
          violation or fraud, we may withhold or forfeit pending earnings to fund refunds and chargebacks, as permitted by
          law.
        </p>
      </Section>

      <Section heading="9. Contact">
        <p>
          Creator support:{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          . {LEGAL.entity}, {LEGAL.address}.
        </p>
      </Section>
    </LegalDoc>
  );
}
