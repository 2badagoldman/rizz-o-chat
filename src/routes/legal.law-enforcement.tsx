import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/legal/law-enforcement")({
  head: () => ({
    meta: [
      { title: "Law Enforcement Guidelines — Rizzla Chat" },
      {
        name: "description",
        content:
          "How law enforcement and government agencies can submit legal requests, preservation demands and emergency disclosure requests to Rizzla Chat, and what data may be available.",
      },
      { property: "og:title", content: "Law Enforcement Guidelines — Rizzla Chat" },
      { property: "og:description", content: "Legal process, preservation requests, emergency disclosures and child-safety escalation." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://rizzlachat.com/legal/law-enforcement" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/legal/law-enforcement" }],
  }),
  component: LawEnforcement;
});

function LawEnforcement() {
  return (
    <LegalDoc
      title="Law enforcement guidelines"
      subtitle={`These guidelines explain how ${LEGAL.entity}, operator of ${LEGAL.productName}, handles requests for user information from law enforcement and government agencies. They are informational and are not a waiver of any objection or legal requirement.`}
    >
      <Section heading="1. Where to send requests">
        <p>
          Send all legal process, preservation requests and emergency requests to{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}?subject=Law%20Enforcement%20Request`}>
            {LEGAL.supportEmail}
          </a>{" "}
          with the subject line <b className="text-foreground">Law Enforcement Request</b>. Postal service may be
          directed to:
        </p>
        <p className="mt-2">
          {LEGAL.entity} — Legal / Law Enforcement Response
          <br />
          {LEGAL.addressLines.map((l) => (
            <span key={l}>
              {l}
              <br />
            </span>
          ))}
        </p>
        <p className="mt-2">
          We acknowledge properly submitted requests within {LEGAL.supportResponseHours} hours and respond as promptly as
          the applicable legal process allows.
        </p>
      </Section>

      <Section heading="2. What we require">
        <Bullets
          items={[
            "Requests must come from an official government or law enforcement email domain, or on official letterhead, and identify the requesting agency, officer name, badge or ID number, direct phone number and email.",
            "Identify the account with specificity: the profile username, account email, or host/user ID as shown in the app. Requests that do not identify a specific account cannot be processed.",
            "State the legal authority for the request and the offence under investigation, and narrow the time period and categories of data sought.",
            "Non-US authorities should proceed through a Mutual Legal Assistance Treaty, letter rogatory, or another mechanism recognised under US law, unless the request is a voluntary emergency disclosure.",
          ]}
        />
      </Section>

      <Section heading="3. Legal process we honour">
        <Bullets
          items={[
            "Valid subpoena — basic subscriber records such as account email, display name, account creation date, last sign-in, and payment records held by us (we never store full card numbers).",
            "Court order — non-content records such as transaction logs, membership history and moderation records.",
            "Search warrant issued on probable cause — stored content such as profile media, captions and messages, to the extent we retain it.",
            "We may notify the affected user of a request unless we are legally prohibited from doing so, or where notice would create a risk of harm, child endangerment, or destruction of evidence.",
            "We may object to, narrow, or decline requests that are overbroad, legally defective, or inconsistent with applicable law.",
          ]}
        />
      </Section>

      <Section heading="4. Preservation requests">
        <Bullets
          items={[
            "On receipt of a valid preservation request under 18 U.S.C. § 2703(f) we will preserve then-existing records associated with the identified account for 90 days, extendable once for a further 90 days on renewed request.",
            "Preservation does not disclose any data — formal legal process is still required for release.",
          ]}
        />
      </Section>

      <Section heading="5. Emergency disclosure requests">
        <Bullets
          items={[
            "Where there is a good-faith belief that an emergency involving danger of death or serious physical injury requires disclosure without delay, we may voluntarily disclose limited information.",
            "Mark the email subject EMERGENCY DISCLOSURE REQUEST and include the nature of the emergency, the person at risk, why the danger is imminent, and the specific information needed.",
            "Emergency requests are triaged ahead of all other correspondence.",
          ]}
        />
      </Section>

      <Section heading="6. Child safety and exploitation">
        <Bullets
          items={[
            `${LEGAL.productName} is strictly for adults aged ${LEGAL.minAge}+. Sexual content involving minors is prohibited and results in immediate account termination.`,
            "Suspected child sexual abuse material is reported to the National Center for Missing & Exploited Children (NCMEC) and to law enforcement, and related content and account records are preserved.",
            "Human trafficking, coercion and commercial sexual services are prohibited and are escalated to the appropriate authorities.",
          ]}
        />
      </Section>

      <Section heading="7. Data we hold, and what we do not">
        <Bullets
          items={[
            "We do not store full payment card numbers or bank credentials — card data is handled by our PCI-compliant payment processor, which must be served separately for card details.",
            "We do not retain data we never collect. Some in-app chat history is stored only on a user's own device and is not available to us.",
            "Retention periods are described in our Privacy Policy; records may be deleted in the ordinary course of business before a request is received unless preserved.",
          ]}
        />
      </Section>

      <Section heading="8. Related policies">
        <Bullets
          items={[
            <>
              <Link to="/legal/privacy" className="font-semibold text-primary">
                Privacy Policy
              </Link>{" "}
              — what we collect, retention and disclosure.
            </>,
            <>
              <Link to="/legal/acceptable-use" className="font-semibold text-primary">
                Acceptable Use &amp; Content Policy
              </Link>{" "}
              — prohibited conduct and enforcement.
            </>,
            <>
              <Link to="/legal/dmca" className="font-semibold text-primary">
                DMCA &amp; Content Removal
              </Link>{" "}
              — urgent removal of infringing or non-consensual content.
            </>,
          ]}
        />
      </Section>
    </LegalDoc>
  );
}
