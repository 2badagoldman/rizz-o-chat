import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { WelcomeShowcase } from "../components/WelcomeShowcase";

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0B0B12" },
      { title: "Rizz Social — Real conversations with verified hosts" },
      {
        name: "description",
        content:
          "Rizz Social is a paid social chat platform where verified Hosts run Friends Lists and Members subscribe to join. Hosts are compensated partners.",
      },
      { property: "og:title", content: "Rizz Social — Real conversations with verified hosts" },
      {
        property: "og:description",
        content:
          "Rizz Social is a paid social chat platform where verified Hosts run Friends Lists and Members subscribe to join. Hosts are compensated partners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Rizz Social — Real conversations with verified hosts" },
      { name: "twitter:description", content: "Rizz Social is a paid social chat platform where verified Hosts run Friends Lists and Members subscribe to join. Hosts are compensated partners." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/QKbM332Aiicb6QWrOX0NvvL74SG3/social-images/social-1784530898145-unnamed.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/QKbM332Aiicb6QWrOX0NvvL74SG3/social-images/social-1784530898145-unnamed.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
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
  useEffect(() => {
    void import("../lib/pwa").then((m) => m.registerPwa());
    void import("../lib/analytics").then((m) => {
      m.startAnalytics();
      m.trackPageview(window.location.pathname);
    });
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
        <Outlet />
        <WelcomeShowcase />
      </AuthProvider>
    </QueryClientProvider>
  );
}

