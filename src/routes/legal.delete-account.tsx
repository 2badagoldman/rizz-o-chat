import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/delete-account")({
  head: () =>
    pageHead({
      path: "/legal/delete-account",
      title: "Delete Your Account & Data — Crush Chat",
      description:
        "How to delete your Crush Chat account and personal data from inside the app or by email, what is erased immediately, and what we must keep for legal reasons.",
      type: "article",
    }),
  component: DeleteAccount,
});

function DeleteAccount() {
  return (
    <LegalDoc
      title="Delete Your Account & Data"
      subtitle="You can permanently delete your Crush account yourself, at any time, from inside the app — no email required."
    >
      <Section heading="Delete from inside the app">
        <Bullets
          items={[
            <>Open <b className="text-foreground">Profile</b> from the bottom navigation.</>,
            <>Scroll to <b className="text-foreground">Delete my account</b>.</>,
            <>Type <b className="text-foreground">DELETE</b> to confirm.</>,
            <>Your account and data are removed immediately and you are signed out.</>,
          ]}
        />
      </Section>

      <Section heading="Delete by email">
        <p>
          If you can&apos;t sign in, email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          with the subject <b className="text-foreground">PRIVACY — DELETE ACCOUNT</b> from the address on your
          account. We verify ownership and complete deletion within 30 days (usually within{" "}
          {LEGAL.supportResponseHours} hours).
        </p>
      </Section>

      <Section heading="What is deleted">
        <Bullets
          items={[
            "Your login, profile, bio, username and avatar.",
            "Uploaded photos, videos and captions, including stored files.",
            "Messages you sent, chat history, reactions and room membership.",
            "Friends List memberships, wallet balance and unspent coins (no refund).",
            "Age-verification documents and selfie images.",
            "Push notification device tokens.",
          ]}
        />
      </Section>

      <Section heading="What we must keep, and for how long">
        <Bullets
          items={[
            "Payment and tax records — kept up to 7 years as required by financial law.",
            "Abuse, safety and law-enforcement records — kept up to 5 years to keep the platform safe.",
            "Aggregated, non-identifying analytics that cannot be linked back to you.",
          ]}
        />
        <p>
          Retained records are stored separately, access-restricted, and never used to re-create your profile or
          contact you for marketing.
        </p>
      </Section>

      <Section heading="Deletion is permanent">
        <p>
          Deleted accounts cannot be restored. If you rejoin later you start a new account and must complete 18+
          verification again. Cancel any active membership before deleting if you want to avoid a final renewal
          charge — see the Refund &amp; Cancellation Policy.
        </p>
      </Section>
    </LegalDoc>
  );
}
