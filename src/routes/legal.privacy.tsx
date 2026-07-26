import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/privacy")({
  head: () => pageHead({
    path: "/legal/privacy",
    title: "Privacy Policy \u2014 Rizzla Chat",
    description: "How Rizzla Chat collects, uses, shares and protects your data: account details, media uploads, messages, payment data via Stripe, analytics, retention periods and your GDPR/CCPA rights.",
    type: "article",
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalDoc
      title="Privacy Policy"
      subtitle={`${LEGAL.entity} is the data controller for ${LEGAL.productName}. This policy explains what we collect, why, who we share it with, and the choices you have.`}
    >
      <Section heading="1. Data we collect">
        <Bullets
          items={[
            <>
              <b className="text-foreground">Account data</b> — email address, display name, password hash (managed by our
              auth provider), age confirmation, gender if you choose to provide it, and role (member, host, admin).
            </>,
            <>
              <b className="text-foreground">Profile content</b> — bio, photos, videos and captions you upload, and the
              access settings you choose for them.
            </>,
            <>
              <b className="text-foreground">Communications</b> — direct messages, room messages, gift and tip records, and
              prompts you send to our AI assistant.
            </>,
            <>
              <b className="text-foreground">Purchase data</b> — the products you buy, amounts, currency, subscription
              status, renewal dates, and the customer/subscription identifiers returned by Stripe. We never receive or
              store your full card number, CVC or bank credentials.
            </>,
            <>
              <b className="text-foreground">Usage and device data</b> — pages viewed, session duration, referrer, approximate
              location derived from IP (country/city level), device type, browser and timestamps.
            </>,
            <>
              <b className="text-foreground">Support data</b> — the content of emails and reports you send us.
            </>,
          ]}
        />
      </Section>

      <Section heading="2. Why we use it (and our legal bases)">
        <Bullets
          items={[
            "To provide the Service — create your account, deliver chats, rooms, media and memberships (performance of a contract).",
            "To process payments, renewals, refunds and payouts (performance of a contract, legal obligation).",
            "To keep the platform safe — age assurance, fraud and chargeback prevention, moderation, abuse investigation (legitimate interests, legal obligation).",
            "To improve the product — aggregate analytics, feature ranking and showcase optimisation (legitimate interests).",
            "To communicate service, billing and security notices (contract, legitimate interests).",
            "To send marketing updates only where you have opted in, with one-click unsubscribe (consent).",
          ]}
        />
      </Section>

      <Section heading="3. Who we share data with">
        <p>We do not sell your personal data. We share only what each provider needs to perform its function:</p>
        <Bullets
          items={[
            "Stripe, Inc. — payment processing, subscription billing, fraud screening and tax calculation. Card data is collected directly by Stripe.",
            "Cloud hosting, database, authentication and file storage providers — to run the app and store your account, messages and media.",
            "AI model providers — to generate assistant replies and AI host messages from the prompt you submit.",
            "Email and analytics providers — transactional email delivery and aggregate product analytics.",
            "Other users — the profile information, media and messages you deliberately publish or send to them.",
            "Law enforcement or regulators — where legally required, or to investigate fraud, child safety or serious harm.",
            "An acquirer — if the business is merged or sold, subject to this policy.",
          ]}
        />
      </Section>

      <Section heading="4. International transfers">
        <p>
          Our providers may process data in the United States and other countries. Where data leaves the UK/EEA, transfers
          rely on Standard Contractual Clauses or an equivalent approved mechanism, plus provider-side encryption in
          transit and at rest.
        </p>
      </Section>

      <Section heading="5. How long we keep it">
        <Bullets
          items={[
            "Account and profile data — for as long as your account is active.",
            "Messages and media — until you delete them or your account is deleted; deleted items may remain in encrypted backups for up to 30 days.",
            "Transaction and tax records — retained for up to 7 years as required by financial and tax law, even after account deletion.",
            "Moderation, fraud and ban records — retained up to 5 years to prevent repeat abuse.",
            "Analytics events — retained in aggregate form; raw session records are pruned within 24 months.",
          ]}
        />
      </Section>

      <Section heading="6. Your rights">
        <p>
          Depending on where you live (including under GDPR/UK GDPR, and the CCPA/CPRA for California residents), you can
          request: access to your data, a portable copy, correction, deletion, restriction, objection to processing based
          on legitimate interests, and withdrawal of consent. California residents may also opt out of "sharing" for
          cross-context behavioural advertising — we do not engage in that, and we do not sell personal information.
        </p>
        <p>
          To exercise any right, email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          from your account address. We respond within 30 days and never charge a fee or degrade your service for making a
          request. You may also complain to your local data protection authority.
        </p>
      </Section>

      <Section heading="7. Security">
        <Bullets
          items={[
            "Encryption in transit (TLS) and at rest at our hosting and storage providers.",
            "Row-level database security so users can only read the records they are entitled to.",
            "Private media buckets served through short-lived signed URLs — paid media is not publicly addressable.",
            "Role-based admin access, server-side price and entitlement validation, and signature-verified payment webhooks.",
            "No card numbers, CVCs or bank details are stored on our systems at any time.",
          ]}
        />
        <p>
          No online service can be perfectly secure. If we become aware of a breach affecting your personal data, we will
          notify you and the relevant authority where legally required.
        </p>
      </Section>

      <Section heading={`8. Children — ${LEGAL.minAge}+ only`}>
        <p>
          The Service is restricted to adults aged {LEGAL.minAge}+. We do not knowingly collect data from minors. If we
          learn a minor has registered, we delete the account and its data promptly. Report concerns to {LEGAL.supportEmail}.
        </p>
      </Section>

      <Section heading="9. Cookies and local storage">
        <p>
          We use strictly necessary cookies for sign-in and session security, plus local storage for preferences (theme,
          chat history on your device) and privacy-conscious analytics. See our Cookie Policy for detail and choices.
        </p>
      </Section>

      <Section heading="10. Changes and contact">
        <p>
          We will post any change here and update the "Last updated" date; material changes are also announced in-app.
          Contact the controller: {LEGAL.entity}, {LEGAL.address} —{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          .
        </p>
      </Section>
    </LegalDoc>
  );
}
