/**
 * Shared SEO + social-share metadata helpers.
 *
 * Produces the full tag set that Google, X/Twitter, Facebook, Instagram,
 * TikTok, LinkedIn, WhatsApp, iMessage, Discord and Pinterest read when a
 * link is pasted or crawled. Every public route should build its `head()`
 * from `pageHead()` so previews stay consistent everywhere.
 */

export const SITE_URL = "https://rizzlachat.com";
export const SITE_NAME = "Crush";
export const TWITTER_HANDLE = "@rizzlachat";

/** 1200x630 branded share card — the size every social platform crops from. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.jpg`;
export const DEFAULT_OG_IMAGE_ALT =
  "Crush — real chats with verified creators";

export type PageHeadInput = {
  /** Absolute path, e.g. "/discover". Used for canonical + og:url. */
  path: string;
  title: string;
  description: string;
  /** Absolute https URL. Defaults to the branded share card. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile" | "product";
  keywords?: string;
  /** Keep the page out of search results (private / gated surfaces). */
  noindex?: boolean;
  /** Extra meta entries appended after the generated ones. */
  extraMeta?: Array<Record<string, string>>;
};

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Meta + link tags for a page. Spread into a route's `head()`. */
export function pageHead(input: PageHeadInput) {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.image ?? DEFAULT_OG_IMAGE);
  const imageAlt = input.imageAlt ?? DEFAULT_OG_IMAGE_ALT;
  const type = input.type ?? "website";

  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: input.description },

    // Open Graph — Facebook, Instagram, LinkedIn, WhatsApp, iMessage, Discord,
    // Pinterest and TikTok all read these.
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: imageAlt },

    // X / Twitter cards
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:creator", content: TWITTER_HANDLE },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },

    // Generic / legacy crawlers (Slack, Telegram, some in-app browsers)
    { itemProp: "name", content: input.title },
    { itemProp: "description", content: input.description },
    { itemProp: "image", content: image },
  ];

  if (input.keywords) meta.push({ name: "keywords", content: input.keywords });

  meta.push({
    name: "robots",
    content: input.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  });

  if (input.extraMeta) meta.push(...input.extraMeta);

  return {
    meta,
    links: input.noindex ? [] : [{ rel: "canonical", href: url }],
  };
}

/** Convenience for gated app surfaces that should never be indexed. */
export function privateHead(title: string, description = "Crush") {
  return pageHead({ path: "/", title, description, noindex: true });
}
