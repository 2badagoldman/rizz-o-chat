import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Rizzla Chat" },
      {
        name: "description",
        content:
          "The Rizzla Chat Terms of Service: eligibility (18+), account rules, coins and memberships, creator obligations, payments, liability and dispute resolution.",
      },
      { property: "og:title", content: "Terms of Service — Rizzla Chat" },
      { property: "og:description", content: "Account rules, purchases, creator obligations, liability and dispute resolution for Rizzla Chat." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://rizzlachat.com/legal/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/legal/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalDoc
      title="Terms of Service"
      subtitle={`These Terms are a binding agreement between you and ${LEGAL.entity} ("Rizzla", "we", "us") covering your use of ${LEGAL.siteLabel} and the Rizzla apps.`}
    >
      <Section heading="1. Acceptance of these Terms">
        <p>
          By creating an account, purchasing coins or a membership, or otherwise using {LEGAL.productName} (the
          "Service"), you agree to these Terms, our Privacy Policy, Acceptable Use & Content Policy, Refund &
          Cancellation Policy and Billing & Payment Terms. If you do not agree, do not use the Service.
        </p>
        <p>
          We may update these Terms. Material changes are announced in-app or by email at least 7 days before they take
          effect, and the "Last updated" date above always reflects the current version. Continued use after the
          effective date means you accept the updated Terms.
        </p>
      </Section>

      <Section heading={`2. Eligibility — ${LEGAL.minAge}+ only`}>
        <Bullets
          items={[
            `The Service is strictly for adults aged ${LEGAL.minAge} or older. Accounts belonging to minors are terminated on discovery and purchases refunded to the payment method on file.`,
            "You must have the legal capacity to enter into a contract and must not be barred from using the Service under the laws of your jurisdiction.",
            "You may not use the Service if you appear on any sanctions list or reside in an embargoed territory.",
            "One account per person. Accounts are personal, non-transferable, and may not be sold, shared or rented.",
          ]}
        />
      </Section>

      <Section heading="3. What Rizzla is (and is not)">
        <p>
          Rizzla is a social chat and creator-membership platform. Members can browse creator ("Host") profiles, join a
          Host's Friends List, chat one-to-one, join group Rooms, send digital gifts and tips, and use our AI chat
          assistant for conversation coaching.
        </p>
        <Bullets
          items={[
            "Rizzla is entertainment and social networking. We do not provide escort, dating-guarantee, matchmaking, financial, legal, medical or therapeutic services.",
            "Some profiles are clearly labelled as AI hosts or demo content. AI conversations are machine-generated, may be inaccurate, and are not a real person's advice.",
            "We do not employ Hosts. Hosts are independent creators responsible for their own content and conduct.",
            "Nothing on the Service is an offer of, or payment for, sexual services. Such use is prohibited and reported where required.",
          ]}
        />
      </Section>

      <Section heading="4. Accounts and security">
        <Bullets
          items={[
            "You must provide accurate registration details and keep them current.",
            "You are responsible for all activity under your account and for keeping your credentials secure.",
            "Notify us immediately at " + LEGAL.supportEmail + " if you suspect unauthorised access.",
            "We may suspend or terminate an account that violates these Terms, poses a security, fraud or chargeback risk, or is required to be removed by law or by our payment provider.",
          ]}
        />
      </Section>

      <Section heading="5. Coins, memberships, gifts and tips">
        <Bullets
          items={[
            "Coins are a limited, revocable licence to access digital features inside Rizzla. Coins are not money, not a deposit, not stored value redeemable for cash, and carry no interest or ownership rights.",
            "Coins have no cash value, cannot be exchanged for cash, transferred between accounts, or sold outside the Service.",
            "Memberships (including Rizz Gold, Rizz VIP and a Host's Friends List) are recurring subscriptions that renew automatically until cancelled.",
            "Gifts and tips are voluntary, immediately delivered digital items. Once sent, they are consumed and non-reversible.",
            "Prices are shown in " + LEGAL.currency + " before payment. Full pricing, tax and renewal detail is in our Billing & Payment Terms.",
          ]}
        />
      </Section>

      <Section heading="6. Your content and licence to us">
        <p>
          You keep ownership of the photos, videos, text and messages you upload ("Your Content"). You grant us a
          worldwide, non-exclusive, royalty-free licence to host, store, reproduce, adapt (for formatting, thumbnails
          and compression) and display Your Content solely to operate, secure, moderate and promote the Service.
        </p>
        <Bullets
          items={[
            "You confirm you own or have all rights to Your Content and that every identifiable person in it is an adult who consented to its upload and display.",
            "You must not upload content that violates our Acceptable Use & Content Policy.",
            "We may remove content, restrict a feature, or terminate an account for violations, with or without notice where legally required.",
            "Deleting content removes it from the Service; backups and legally required records may persist for a limited period.",
          ]}
        />
      </Section>

      <Section heading="7. Hosts and creator payouts">
        <p>
          Hosts are independent creators, not employees, partners or agents of {LEGAL.entity}. Hosts are solely
          responsible for their own taxes, licences and legal compliance. Revenue split, payout timing, minimum
          thresholds and clawbacks are described in our Creator & Payout Terms, which form part of these Terms for
          anyone who applies to be a Host.
        </p>
      </Section>

      <Section heading="8. Prohibited conduct">
        <Bullets
          items={[
            "Harassment, threats, hate speech, doxxing, stalking or extortion.",
            "Any sexual content involving minors, non-consensual content, trafficking or prostitution — these are reported to law enforcement and result in a permanent ban.",
            "Fraud, stolen cards, payment testing, chargeback abuse, money laundering or coin resale.",
            "Scraping, reverse engineering, automated access, circumventing paywalls, or downloading and redistributing another user's media.",
            "Off-platform solicitation of payments to evade our fees or moderation.",
            "Uploading malware, spam or attempting to disrupt our infrastructure.",
          ]}
        />
      </Section>

      <Section heading="9. AI features">
        <p>
          Our AI assistant and AI hosts generate text automatically. Output may be wrong, outdated or unsuitable. You
          are responsible for how you use it, must not rely on it for legal, medical, financial or safety decisions, and
          must not submit other people's private data or intimate images to it.
        </p>
      </Section>

      <Section heading="10. Third-party services">
        <p>
          We use processors to run the Service, including Stripe for payments, and cloud hosting, database, storage and
          AI providers. Their handling of your data is described in our Privacy Policy. Payment card details are entered
          directly with Stripe and are never stored on our servers.
        </p>
      </Section>

      <Section heading="11. Termination">
        <p>
          You may stop using the Service and delete your account at any time from your profile settings or by emailing{" "}
          {LEGAL.supportEmail}. We may suspend or terminate access for breach of these Terms, suspected fraud, legal
          obligation, or to protect users. On termination, unused coins and unexpired membership time are handled under
          our Refund & Cancellation Policy.
        </p>
      </Section>

      <Section heading="12. Disclaimers">
        <p>
          The Service is provided "as is" and "as available". To the maximum extent permitted by law we disclaim all
          implied warranties, including merchantability, fitness for a particular purpose and non-infringement. We do
          not warrant uninterrupted or error-free operation, and we do not guarantee any level of engagement, earnings,
          matches or responses from any Host or member.
        </p>
      </Section>

      <Section heading="13. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {LEGAL.entity} is not liable for indirect, incidental, special,
          consequential, exemplary or punitive damages, or for lost profits, goodwill or data. Our total aggregate
          liability for any claim relating to the Service is limited to the greater of (a) the amount you paid us in the
          three months before the event giving rise to the claim, or (b) USD 100. Nothing in these Terms limits
          liability that cannot be limited by law.
        </p>
      </Section>

      <Section heading="14. Indemnity">
        <p>
          You agree to indemnify and hold harmless {LEGAL.entity} and its officers, employees and contractors from any
          claim, loss or expense (including reasonable legal fees) arising out of Your Content, your use of the Service,
          or your breach of these Terms.
        </p>
      </Section>

      <Section heading="15. Disputes, governing law and venue">
        <Bullets
          items={[
            `Talk to us first: email ${LEGAL.supportEmail} and we will attempt to resolve any dispute informally within 30 days.`,
            "These Terms are governed by the laws of the State of Texas, USA, without regard to conflict-of-law rules.",
            "Courts located in Dallas County, Texas have exclusive jurisdiction, unless mandatory consumer law in your country of residence gives you the right to bring a claim locally.",
            "Where permitted, claims must be brought individually and not as part of a class or representative action.",
            "Do not open a card chargeback before contacting support — see our Refund & Cancellation Policy.",
          ]}
        />
      </Section>

      <Section heading="16. Miscellaneous">
        <p>
          If any provision is unenforceable, the rest remains in force. Our failure to enforce a provision is not a
          waiver. You may not assign these Terms; we may assign them in a merger, acquisition or sale of assets. These
          Terms, together with the policies referenced in them, are the entire agreement between us.
        </p>
      </Section>

      <Section heading="17. Contact">
        <p>
          {LEGAL.entity}, {LEGAL.address}. Email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          .
        </p>
      </Section>
    </LegalDoc>
  );
}
