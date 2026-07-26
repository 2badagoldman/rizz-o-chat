import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/legal/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Security — Rizzla Chat" },
      {
        name: "description",
        content:
          "How Rizzla Chat protects accounts, private media and payments: row-level database security, signed media links, role-based admin access, verified payment webhooks and no card data on our servers.",
      },
      { property: "og:title", content: "Trust & Security — Rizzla Chat" },
      { property: "og:description", content: "The security and privacy controls behind Rizzla Chat, explained plainly." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://rizzlachat.com/legal/trust" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/legal/trust" }],
  }),
  component: Trust,
});

function Trust() {
  return (
    <LegalDoc
      title="Trust & Security"
      subtitle={`This page is maintained by ${LEGAL.entity} to answer common security and privacy questions about ${LEGAL.productName}. It describes controls that are enabled today — it is not a certification or an independent audit.`}
    >
      <Section heading="Accounts and access">
        <Bullets
          items={[
            "Email and password sign-in plus Google sign-in, handled by a managed authentication service. Passwords are salted and hashed — we never see them.",
            "Leaked-password screening and email verification on sign-up.",
            `Adults only: every account confirms it is ${LEGAL.minAge}+ at registration, and accounts found to belong to minors are removed.`,
            "Roles are stored server-side in a dedicated table. Admin capabilities are never granted from the browser or from client storage.",
          ]}
        />
      </Section>

      <Section heading="Your data in the database">
        <Bullets
          items={[
            "Row-level security is enabled on every application table, so a signed-in user can only read and write the rows they are entitled to.",
            "Membership, pricing and entitlement checks run on the server. Client-supplied prices, coin amounts and roles are never trusted.",
            "Coin spending and gifting run as atomic database transactions, so balances cannot be double-spent.",
            "Encryption in transit (TLS) everywhere, and encryption at rest at our hosting provider.",
          ]}
        />
      </Section>

      <Section heading="Private photos and videos">
        <Bullets
          items={[
            "Paid and private media lives in a private storage bucket that is not publicly addressable.",
            "Access is granted through short-lived signed links issued only after your entitlement is checked server-side.",
            "Captions may be visible before you join a Friends List; the media itself is not.",
            "Deleting media removes it from the app; encrypted backups are rotated out within 30 days.",
          ]}
        />
      </Section>

      <Section heading="Payments">
        <Bullets
          items={[
            "Card details are entered directly into Stripe's PCI-DSS compliant checkout. No card number, CVC or bank credential ever reaches our servers or database.",
            "Purchase confirmations arrive through signature-verified webhooks and are processed exactly once, so you are never credited or charged twice.",
            "Prices are resolved server-side from our catalogue, so a purchase cannot be tampered with in the browser.",
            <>
              Card statements show <b className="text-foreground">{LEGAL.statementDescriptor}</b>, and every charge is
              receipted by email. See our{" "}
              <Link to="/legal/billing" className="font-semibold text-primary">
                Billing Terms
              </Link>
              .
            </>,
          ]}
        />
      </Section>

      <Section heading="Moderation and safety">
        <Bullets
          items={[
            "In-app reporting on profiles, chats and rooms, with prioritised handling for child-safety and non-consensual imagery reports.",
            "Role-restricted admin review of reported content, used for safety and dispute investigation.",
            "Soft delete with a 7-day restore window, so mistaken removals can be reversed.",
            <>
              Rules and enforcement steps are published in our{" "}
              <Link to="/legal/acceptable-use" className="font-semibold text-primary">
                Acceptable Use & Content Policy
              </Link>
              .
            </>,
          ]}
        />
      </Section>

      <Section heading="Shared responsibility">
        <p>
          Our hosting, authentication, storage and payment providers secure the underlying infrastructure.{" "}
          {LEGAL.entity} is responsible for the application's access rules, moderation and data handling. You are
          responsible for keeping your password private, only uploading content you have the right to share, and reporting
          anything that looks wrong.
        </p>
      </Section>

      <Section heading="Report a vulnerability">
        <p>
          Email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          with the subject <b className="text-foreground">SECURITY</b>. Please give us reasonable time to fix an issue before
          disclosing it, and do not access other users' data while testing. We acknowledge reports within{" "}
          {LEGAL.supportResponseHours} hours.
        </p>
      </Section>
    </LegalDoc>
  );
}
