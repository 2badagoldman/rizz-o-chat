import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SwipeDeck } from "@/components/SwipeDeck";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/swipe")({
  head: () => ({
    ...pageHead({
      path: "/swipe",
      title: "Swipe creators — Crush",
      description: "Swipe right on the creators you like, left to pass. A fast way to find your next favorite chat on Crush.",
      keywords: "swipe creators, match with creators, chat matches, crush swipe",
    }),
    scripts: [
      breadcrumbLd([
        { name: "Crush", path: "/" },
        { name: "Discover creators", path: "/discover" },
        { name: "Swipe", path: "/swipe" },
      ]),
    ],
  }),
  component: SwipePage,
});

function SwipePage() {
  return (
    <AppShell footerNote={<>Creators on Crush are compensated partners.</>}>
      <header className="pt-4">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Discover
        </Link>
        <h1 className="mt-2 text-2xl">Swipe to find your match</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Right if you like her, left to keep looking. New creator every swipe.
        </p>
      </header>

      <div className="mt-5">
        <SwipeDeck full />
      </div>
    </AppShell>
  );
}
