import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/contact")({
  head: () => pageHead({
    path: "/legal/contact",
    title: "Contact & Business Details \u2014 Crush Chat",
    description: "Contact Crush Chat support: legal entity KOLO TECHNOLOGY LLC, business address in Garland, Texas, support email, response times and escalation paths for billing, privacy and safety.",
    type: "article",
  }),
  component: Contact,
});

function Contact() {
  return (
    <LegalDoc
      title="Contact & Business Details"
      subtitle="One inbox, real replies. Every request below goes to the same address and is routed internally."
    >
      <Section heading="Business identity">
        <p>
          <b className="text-foreground">{LEGAL.entity}</b>
          <br />
          {LEGAL.addressLines.map((l) => (
            <span key={l}>
              {l}
              <br />
            </span>
          ))}
          Trading as {LEGAL.brand} · {LEGAL.siteLabel}
          <br />
          Card statement descriptor: <b className="text-foreground">{LEGAL.statementDescriptor}</b>
        </p>
      </Section>

      <Section heading="How to reach us">
        <p>
          Email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          — we reply within {LEGAL.supportResponseHours} hours, 7 days a week. Use one of these subject lines so we can
          route it fast:
        </p>
        <Bullets
          items={[
            <><b className="text-foreground">BILLING</b> — charges, receipts, refunds, cancellations.</>,
            <><b className="text-foreground">PRIVACY</b> — data access, correction, deletion or export requests.</>,
            <><b className="text-foreground">URGENT REMOVAL</b> — non-consensual content or child-safety reports (actioned within 24 hours).</>,
            <><b className="text-foreground">SECURITY</b> — vulnerability reports.</>,
            <><b className="text-foreground">CREATOR</b> — Host applications, payouts and pricing.</>,
          ]}
        />
      </Section>

      <Section heading="Self-service">
        <Bullets
          items={[
            <>
              Cancel or resume a membership, update your card and download invoices:{" "}
              <Link to="/subscriptions" className="font-semibold text-primary">
                My subscriptions
              </Link>
              .
            </>,
            <>
              Buy coins or review pack pricing:{" "}
              <Link to="/coins" className="font-semibold text-primary">
                Coins
              </Link>
              .
            </>,
            <>
              Refund rules and how to request one:{" "}
              <Link to="/legal/refunds" className="font-semibold text-primary">
                Refund & Cancellation Policy
              </Link>
              .
            </>,
          ]}
        />
      </Section>

      <Section heading="Escalation">
        <p>
          If you are not satisfied with a reply, respond to the same thread with the word <b className="text-foreground">ESCALATE</b>
          . A different reviewer reassesses within 5 business days. Formal legal notices should be sent by post to the
          registered address above, marked "Legal".
        </p>
      </Section>
    </LegalDoc>
  );
}
