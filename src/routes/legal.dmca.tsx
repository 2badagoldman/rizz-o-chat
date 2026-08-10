import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/dmca")({
  head: () => pageHead({
    path: "/legal/dmca",
    title: "DMCA & Content Removal \u2014 Crush Chat",
    description: "How to report copyright infringement, non-consensual imagery or impersonation on Crush Chat, what a valid DMCA notice must include, and how counter-notices are handled.",
    type: "article",
  }),
  component: Dmca,
});

function Dmca() {
  return (
    <LegalDoc
      title="DMCA & Content Removal"
      subtitle="We remove infringing and non-consensual content quickly. Urgent reports involving intimate imagery or a minor are actioned within 24 hours."
    >
      <Section heading="1. Urgent removal requests">
        <p>
          If content on Crush shows you (or someone you are reporting for) without consent, or involves a minor, email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          with the subject line <b className="text-foreground">URGENT REMOVAL</b>. Include the profile name and a link or
          description. We remove the content while we investigate — you do not need to prove ownership first.
        </p>
      </Section>

      <Section heading="2. Filing a DMCA takedown notice">
        <p>Send a written notice to our designated agent that includes all of the following:</p>
        <Bullets
          items={[
            "Your full name, address, phone number and email address.",
            "Identification of the copyrighted work you claim was infringed.",
            "The location on Crush of the material (profile name plus a link or screenshot).",
            "A statement that you have a good-faith belief the use is not authorised by the copyright owner, its agent, or the law.",
            "A statement that the information in the notice is accurate and, under penalty of perjury, that you are the owner or authorised to act on the owner's behalf.",
            "Your physical or electronic signature.",
          ]}
        />
        <p>
          Designated agent: Copyright Agent, {LEGAL.entity}, {LEGAL.address}. Email:{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          .
        </p>
      </Section>

      <Section heading="3. What happens next">
        <Bullets
          items={[
            "We acknowledge valid notices and remove or disable access to the reported material, usually within 2 business days.",
            "We notify the uploader and give them the opportunity to submit a counter-notice.",
            "Repeat infringers lose Creator status and have their accounts terminated under our repeat-infringer policy.",
          ]}
        />
      </Section>

      <Section heading="4. Counter-notice">
        <p>
          If your content was removed and you believe that was a mistake or misidentification, you may send a counter-notice
          containing your contact details, identification of the removed material and its former location, a statement under
          penalty of perjury that the removal was a mistake or misidentification, your consent to the jurisdiction of the
          federal court for your district (or the Northern District of Texas if you are outside the United States), and your
          signature. We may restore the material after 10 business days unless the original complainant files a court action.
        </p>
      </Section>

      <Section heading="5. Misuse of this process">
        <p>
          Knowingly false takedown or counter-notices may result in liability for damages under 17 U.S.C. § 512(f) and
          termination of your Crush account.
        </p>
      </Section>
    </LegalDoc>
  );
}
