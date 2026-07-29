import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { DEMO_HOSTS } from "@/lib/demo-hosts";

const BASE_URL = "https://rizzlachat.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/discover", changefreq: "daily", priority: "0.9" },
  { path: "/rooms", changefreq: "daily", priority: "0.8" },
  { path: "/copilot", changefreq: "weekly", priority: "0.7" },
  { path: "/blog/creator-pricing-guide", changefreq: "monthly", priority: "0.7" },
  { path: "/upgrade", changefreq: "weekly", priority: "0.7" },
  { path: "/coins", changefreq: "weekly", priority: "0.6" },
  { path: "/auth", changefreq: "monthly", priority: "0.5" },
  { path: "/legal", changefreq: "monthly", priority: "0.5" },
  { path: "/legal/terms", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/privacy", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/refunds", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/billing", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/pricing", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/law-enforcement", changefreq: "monthly", priority: "0.3" },
  { path: "/legal/acceptable-use", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/creators", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/cookies", changefreq: "monthly", priority: "0.3" },
  { path: "/legal/dmca", changefreq: "monthly", priority: "0.3" },
  { path: "/legal/trust", changefreq: "monthly", priority: "0.4" },
  { path: "/legal/contact", changefreq: "monthly", priority: "0.4" },
];

const HOST_ENTRIES: SitemapEntry[] = DEMO_HOSTS.map((h) => ({
  path: `/host/${h.id}`,
  changefreq: "weekly" as const,
  priority: "0.6",
}));

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = [...ENTRIES, ...HOST_ENTRIES].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
