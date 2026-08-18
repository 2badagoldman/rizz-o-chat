import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/app-access")({
  head: () =>
    pageHead({
      path: "/legal/app-access",
      title: "How to Access the Crush App \u2014 Crush Chat",
      description:
        "Access Crush on any device: the full product runs at rizzlachat.com and installs to the home screen as an app. Native iOS and Android builds are pending store review; store billing is handled by Apple and Google.",
      type: "article",
    }),
  component: AppAccess,
});

function AppAccess() {
  return (
    <LegalDoc
      title="How to access the Crush app"
      subtitle={`${LEGAL.productName} is a web application. There is nothing to download to use it, and every feature is reachable from a browser on any device.`}
    >
      <Section heading="1. Primary access — the web app">
        <Bullets
          items={[
            <>
              Open{" "}
              <a className="font-semibold text-primary" href="https://rizzlachat.com">
                https://rizzlachat.com
              </a>{" "}
              in any browser on desktop, iOS or Android. No download, no app store account required.
            </>,
            "All card payments processed through this website are handled by Stripe Checkout on the web.",
            "Sign-up, 18+ age gate, government-ID verification, membership checkout, and cancellation are all completed in the web app.",
          ]}
        />
      </Section>

      <Section heading="2. Installing it as an app (PWA)">
        <Bullets
          items={[
            "iOS Safari: tap Share → “Add to Home Screen”. The app then opens full-screen with its own icon.",
            "Android Chrome: tap the ⋮ menu → “Install app” (or accept the install banner shown in-app).",
            "Desktop Chrome/Edge: click the install icon in the address bar.",
            "The installed app is the same web application described above; it uses the same Stripe web checkout.",
          ]}
        />
      </Section>

      <Section heading="3. Native iOS and Android builds">
        <Bullets
          items={[
            "Native builds are packaged with Capacitor from the same codebase and have not yet been published; they are pending Apple App Store and Google Play review.",
            "No native app is publicly downloadable today, which is why no store link exists yet.",
            "When those builds go live, in-app purchases inside them are billed by Apple and Google through RevenueCat, not through Stripe. Stripe processes web payments only.",
            "We will provide the store listing URLs, and a TestFlight / Play internal-testing invite, as soon as review completes.",
          ]}
        />
      </Section>

      <Section heading="4. Reviewer access">
        <p>
          Reviewers can create a free account at{" "}
          <a className="font-semibold text-primary" href="https://rizzlachat.com/auth">
            rizzlachat.com/auth
          </a>{" "}
          and reach every flow without payment. Free AI conversations require no account at all. For a guided walkthrough
          or a pre-provisioned test account, email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          .
        </p>
        <Bullets
          items={[
            <>
              Age gate and sign-up:{" "}
              <Link to="/auth" className="font-semibold text-primary">
                /auth
              </Link>
            </>,
            <>
              Government-ID / 18+ verification:{" "}
              <Link to="/verify" className="font-semibold text-primary">
                /verify
              </Link>
            </>,
            <>
              Paywall and checkout:{" "}
              <Link to="/upgrade" className="font-semibold text-primary">
                /upgrade
              </Link>
            </>,
            <>
              Cancellation:{" "}
              <Link to="/subscriptions" className="font-semibold text-primary">
                /subscriptions
              </Link>
            </>,
            <>
              AI companion labelling:{" "}
              <Link to="/legal/ai-companions" className="font-semibold text-primary">
                /legal/ai-companions
              </Link>
            </>,
          ]}
        />
      </Section>
    </LegalDoc>
  );
}
