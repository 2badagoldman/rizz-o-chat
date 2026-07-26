// Single source of truth for legal/company facts used across policy pages.
// Update these values here and every policy page stays consistent.

export const LEGAL = {
  brand: "Rizzla",
  productName: "Rizzla Chat (Rizz Social)",
  entity: "KOLO TECHNOLOGY LLC",
  addressLines: ["1802 Pleasant Valley Rd, Ste 400", "Garland, TX 75040-2861", "United States"],
  address: "1802 Pleasant Valley Rd, Ste 400, Garland, TX 75040-2861, United States",
  supportEmail: "rizzchatsupport@gmail.com",
  site: "https://rizzlachat.com",
  siteLabel: "rizzlachat.com",
  statementDescriptor: "RIZZLA CHAT",
  minAge: 18,
  refundWindowDays: 14,
  supportResponseHours: 48,
  currency: "USD",
  lastUpdated: "July 26, 2026",
} as const;

export const LEGAL_PAGES = [
  { to: "/legal/terms", title: "Terms of Service", blurb: "The agreement between you and us for using Rizzla." },
  { to: "/legal/privacy", title: "Privacy Policy", blurb: "What we collect, why, who processes it, and your rights." },
  { to: "/legal/refunds", title: "Refund & Cancellation Policy", blurb: "Coins, memberships, tips, renewals and how to cancel." },
  { to: "/legal/billing", title: "Billing & Payment Terms", blurb: "Pricing, taxes, currency, renewals and card statements." },
  { to: "/legal/acceptable-use", title: "Acceptable Use & Content Policy", blurb: "18+ rules, prohibited content, moderation and enforcement." },
  { to: "/legal/creators", title: "Creator & Payout Terms", blurb: "Revenue split, payout schedule, and host obligations." },
  { to: "/legal/cookies", title: "Cookie Policy", blurb: "Cookies, local storage, and analytics we use." },
  { to: "/legal/dmca", title: "DMCA & Content Removal", blurb: "Report copyright infringement or non-consensual content." },
  { to: "/legal/trust", title: "Trust & Security", blurb: "How the platform is built, hosted and protected." },
  { to: "/legal/contact", title: "Contact & Business Details", blurb: "Legal entity, address, support hours and escalation." },
] as const;
