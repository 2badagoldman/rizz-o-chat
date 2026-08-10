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
      subtitle={`Crush is an adults-only (${LEGAL.minAge}+) social platform. These rules apply to every member, Creator, room, message and upload — no exceptions.`}
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

      <Section heading="4. No sexual or sexually suggestive content">
        <p>
          Crush is a non-sexual conversation platform. Sexually explicit and sexually suggestive content is prohibited
          everywhere on the Service — in profiles, bios, photos, videos, captions, display names, room names, direct
          messages, room messages and AI conversations. This includes nudity, partial nudity, lingerie or underwear
          shots, sexual acts or simulations, sexual roleplay or &quot;sexting&quot;, fetish content, and any content
          offered, requested or implied in exchange for money, coins, gifts or a membership.
        </p>
        <p className="mt-3">
          Conversations on Crush are friendly, social and PG-13: getting to know someone, shared interests, everyday
          life, encouragement and light-hearted banter. Our AI Creators are instructed to refuse sexual requests, to state
          that Crush is 18+ and non-sexual, and to redirect the conversation. Members who attempt to steer chats toward
          sexual content are warned, then restricted or banned. Nothing on Crush is an offer of, or payment for, sexual
          services or sexual content of any kind.
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
