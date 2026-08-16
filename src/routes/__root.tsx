import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
import { demoProofsQueryOptions, RUNWAY_LIMIT } from "@/lib/demo-proofs.query";
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { AttributionCapture } from "@/components/AttributionCapture";
import { InstallAppPrompt } from "../components/InstallAppPrompt";
import { PresenceProvider } from "../lib/presence";

import { useShowcaseAvatarSync } from "../lib/showcase-avatar-store";
import { useInitPerfTier } from "../hooks/usePerfTier";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-brand inline-flex items-center justify-center">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    void import("../lib/error-tracking").then((m) =>
      m.reportClientError(error, { mechanism: "react_error_boundary" }),
    );
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-brand"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-[14px] border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Prime the creator runway so it renders with the first paint on every page.
  loader: ({ context }) =>
    context.queryClient
      .ensureQueryData(demoProofsQueryOptions(RUNWAY_LIMIT))
      .catch(() => []),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0B0B12" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Crush" },
      { name: "application-name", content: "Crush" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "format-detection", content: "telephone=no" },
      { title: "Crush — Chat with verified creators" },
      {
        name: "description",
        content:
          "Meet your favorite exclusive creators on CRUSH. Members get 24/7 access to chat, connect, and enjoy one-on-one time with the creators they love.",
      },
      { property: "og:site_name", content: "Crush" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://i.pravatar.cc", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://i.pravatar.cc" },
      { rel: "preconnect", href: "https://loremflickr.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://loremflickr.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://rizzlachat.com/#organization",
              name: "Crush",
              alternateName: "Crush",
              url: "https://rizzlachat.com",
              logo: "https://rizzlachat.com/icon-512.png",
              email: "rizzchatsupport@gmail.com",
              sameAs: ["https://rizz-o-chat.lovable.app"],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  email: "rizzchatsupport@gmail.com",
                  availableLanguage: ["English"],
                },
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://rizzlachat.com/#website",
              name: "Crush",
              url: "https://rizzlachat.com",
              inLanguage: "en-US",
              publisher: { "@id": "https://rizzlachat.com/#organization" },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://rizzlachat.com/discover?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "WebApplication",
              "@id": "https://rizzlachat.com/#app",
              name: "Crush",
              url: "https://rizzlachat.com",
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "Web, iOS, Android",
              browserRequirements: "Requires JavaScript.",
              inLanguage: "en-US",
              publisher: { "@id": "https://rizzlachat.com/#organization" },
              offers: [
                {
                  "@type": "Offer",
                  name: "Crush Gold",
                  price: "9.99",
                  priceCurrency: "USD",
                  url: "https://rizzlachat.com/upgrade",
                },
                {
                  "@type": "Offer",
                  name: "Crush Diamond VIP",
                  price: "19.99",
                  priceCurrency: "USD",
                  url: "https://rizzlachat.com/upgrade",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),


  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Crush ("crushgold") is the default theme, so it ships on the server-rendered <html>
 * and a tiny blocking script swaps in the visitor's saved theme before first
 * paint. Without this the page painted unthemed (pink-ish) until React hydrated.
 */
const THEME_BOOT = `(function(){try{var a=["pink","blue","ocean","abyss","sico","romance","crush","crushgold"];var s=localStorage.getItem("rizz.theme");var t=a.indexOf(s)>-1?s:"sico";var r=document.documentElement;a.forEach(function(x){r.classList.toggle("theme-"+x,x===t)});}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="theme-sico">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useShowcaseAvatarSync();
  useInitPerfTier();
  useEffect(() => {
    void import("../lib/error-tracking").then((m) => m.installClientErrorTracking());
    void import("../lib/pwa").then((m) => m.registerPwa());
    void import("../lib/native").then((m) => m.initNativeShell());
    void import("../lib/analytics").then((m) => {
      m.startAnalytics();
      m.trackPageview(window.location.pathname);
    });
    void import("../lib/install-tracking").then((m) => m.startInstallTracking());
  }, []);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", (evt) => {
      void import("../lib/analytics").then((m) => {
        m.markPageEntered();
        m.trackPageview(evt.toLocation.pathname);
      });
    });
    return () => unsub();
  }, [router]);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PresenceProvider>
          <Outlet />
          <AttributionCapture />
          {/* Welcome showcase pop-up retired — the creator runway sells on every page */}
          <InstallAppPrompt />

        </PresenceProvider>
      </AuthProvider>

    </QueryClientProvider>
  );
}

