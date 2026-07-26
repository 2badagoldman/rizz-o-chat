import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Rizzla Chat" },
      {
        name: "description",
        content:
          "Cookies and local storage used by Rizzla Chat: sign-in session cookies, theme and chat preferences, showcase frequency control, payment security cookies and product analytics.",
      },
      { property: "og:title", content: "Cookie Policy — Rizzla Chat" },
      { property: "og:description", content: "Which cookies and browser storage Rizzla Chat uses, and how to control them." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://rizzlachat.com/legal/cookies" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rizzlachat.com/legal/cookies" }],
  }),
  component: Cookies,
});

function Cookies() {
  return (
    <LegalDoc
      title="Cookie Policy"
      subtitle="We keep browser storage minimal: what is needed to keep you signed in, remember your preferences, secure payments, and understand how the app is used in aggregate."
    >
      <Section heading="1. Strictly necessary">
        <Bullets
          items={[
            "Authentication session — keeps you signed in and protects against session hijacking. Without it you cannot log in.",
            "Security tokens used by our payment provider during checkout to prevent fraud.",
            "Service worker cache for offline support (the installable app), storing app files and images on your device.",
          ]}
        />
      </Section>

      <Section heading="2. Preferences (local storage)">
        <Bullets
          items={[
            "Theme choice (pink or blue mode).",
            "Chat history for AI host conversations, kept on your own device so your threads persist like a messaging app.",
            "Showcase frequency control, so the welcome reel does not repeat too often in a session.",
          ]}
        />
      </Section>

      <Section heading="3. Analytics">
        <Bullets
          items={[
            "Aggregate product analytics: page views, session duration, referrer, device type and country-level location derived from IP.",
            "Used to improve the product and rank showcase content. We do not build advertising profiles and we do not sell this data.",
            "No third-party advertising or cross-site tracking cookies are set by us.",
          ]}
        />
      </Section>

      <Section heading="4. Your choices">
        <Bullets
          items={[
            "Block or delete cookies in your browser settings at any time — note that blocking the session cookie will sign you out and prevent purchases.",
            "Clear local storage from your browser's site settings to reset theme, on-device chat history and showcase state.",
            "Use your browser's private mode to avoid persistent storage entirely.",
            <>
              Questions or a data request? Email{" "}
              <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
                {LEGAL.supportEmail}
              </a>
              .
            </>,
          ]}
        />
      </Section>
    </LegalDoc>
  );
}
