import { Link } from "@tanstack/react-router";
import { LEGAL } from "@/lib/legal";

const LINKS = [
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/privacy", label: "Privacy" },
  { to: "/legal/refunds", label: "Refunds" },
  { to: "/legal/billing", label: "Billing" },
  { to: "/legal/acceptable-use", label: "Community rules" },
  { to: "/legal/cookies", label: "Cookies" },
  { to: "/legal/trust", label: "Trust & security" },
  { to: "/legal/contact", label: "Contact" },
] as const;

export function LegalFooter() {
  return (
    <footer className="mt-10 border-t border-border/60 pt-5 text-center">
      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-[11px] font-semibold text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        {LEGAL.minAge}+ only · Secure card payments · Cancel anytime
        <br />© {new Date().getFullYear()} {LEGAL.entity} · {LEGAL.address}
        <br />
        <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
          {LEGAL.supportEmail}
        </a>
      </p>
    </footer>
  );
}
