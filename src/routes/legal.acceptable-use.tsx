import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/acceptable-use")({
  head: () => pageHead({
    path: "/legal/acceptable-use",
    title: "Acceptable Use & Content Policy \u2014 Crush Chat",
    description: "Crush Chat community rules: 18+ only, consent and age verification for all media, zero tolerance for CSAM, non-consensual content, trafficking, harassment and fraud, plus moderation and appeals.",
    type: "article",
  }),
  component: AcceptableUse,
});

function AcceptableUse() {
  return (
    <LegalDoc
      title="Acceptable Use & Content Policy"
      subtitle={`Crush is an adults-only (${LEGAL.minAge}+) social platform. These rules apply to every member, Host, room, message and upload — no exceptions.`}
    >
      <Section heading="1. Zero tolerance — instant permanent ban">
        <Bullets
          items={[
            "Any sexual content or suggestion involving a minor, or anyone appearing to be a minor. Reported to the National Center for Missing & Exploited Children (NCMEC) and law enforcement.",
            "Non-consensual content: hidden-camera, leaked, revenge or deepfake imagery of a real person, or media of anyone who has not consented to its upload.",
            "Human trafficking, coercion, forced participation, or content advertising commercial sexual services or prostitution.",
            "Sexual violence, bestiality, incest, or content that glorifies rape or abuse.",
            "Threats of violence, terrorism, or promotion of self-harm and suicide.",
            "Extortion or sextortion, including threatening to publish someone's media or messages.",
          ]}
        />
      </Section>

      <Section heading="2. Age and consent requirements for uploads">
        <Bullets
          items={[
            `Every person appearing in content you upload must be ${LEGAL.minAge} or older and must have given consent to appear and to be shown on Crush.`,
            "You must be able to evidence consent and age on request. We may remove media and suspend an account until you can.",
            "Do not upload media you do not own or have not licensed, including content scraped from other platforms or models.",
            "Do not impersonate another person, brand or creator, or use AI likenesses of real people without their consent.",
          ]}
        />
      </Section>

      <Section heading="3. Prohibited content and conduct">
        <Bullets
          items={[
            "Harassment, hate speech or slurs targeting race, ethnicity, religion, nationality, disability, gender identity or sexual orientation.",
            "Doxxing, stalking, or publishing anyone's private data (address, phone, employer, ID documents).",
            "Fraud and financial abuse: stolen cards, payment testing, chargeback abuse, money laundering, pyramid schemes, crypto pump schemes, or coin resale.",
            "Off-platform solicitation designed to evade our fees, moderation or age checks.",
            "Drugs, weapons, counterfeit goods, or any illegal sale.",
            "Spam, mass unsolicited messaging, engagement botting, or automated scraping of profiles and media.",
            "Attempts to bypass paywalls, signed media links, rate limits or security controls, and any reverse engineering of the Service.",
            "Recording, screenshotting and redistributing another user's private media or messages.",
            "Misuse of our AI features to generate sexual content about real people without consent, harassment scripts, or content that violates this policy.",
          ]}
        />
      </Section>

      <Section heading="4. Adult content that is allowed">
        <p>
          Flirtatious, suggestive and tasteful adult-oriented content between consenting adults is permitted, subject to
          the rules above and to any additional restrictions imposed by our payment provider or app store distribution
          rules. Explicit pornographic content, and any content offered in exchange for sexual services, is not permitted
          on Crush.
        </p>
      </Section>

      <Section heading="5. Moderation and enforcement">
        <Bullets
          items={[
            "We use a mix of automated signals, user reports and human admin review.",
            "Admin staff may review profile media, direct messages and room messages when investigating a report, a payment dispute or a safety risk. Access is role-restricted and logged.",
            "Enforcement is proportionate: warning, content removal, feature restriction, temporary suspension, or permanent ban and payout forfeiture for serious cases.",
            "Deleted profiles are held in a recoverable state for 7 days before purge, so mistakes can be reversed.",
            "We cooperate with law enforcement where legally required.",
          ]}
        />
      </Section>

      <Section heading="6. Reporting and appeals">
        <p>
          Report a user, message or upload from the in-app report control, or email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          with the profile name and a description. Urgent child-safety or non-consensual imagery reports are prioritised
          and actioned within 24 hours.
        </p>
        <p>
          If you believe an enforcement action was wrong, reply to the notice email within 30 days and a different reviewer
          will reassess the decision.
        </p>
      </Section>

      <Section heading="7. Your safety">
        <Bullets
          items={[
            "Never send money, gift cards or crypto to someone you met in chat, and never share bank or identity documents.",
            "Keep payments on-platform — off-platform requests are a common scam and lose you all buyer protection.",
            "Block and report anyone who pressures, threatens or attempts to move you to an unmonitored channel.",
            "If you feel unsafe or in immediate danger, contact local emergency services first, then report to us.",
          ]}
        />
      </Section>
    </LegalDoc>
  );
}
