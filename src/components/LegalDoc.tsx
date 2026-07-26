import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LEGAL, LEGAL_PAGES } from "@/lib/legal";

export function LegalDoc({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <AppShell>
      <Link
        to="/legal"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All policies
      </Link>

      <header className="mt-3 overflow-hidden rounded-3xl border border-border bg-card/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{LEGAL.brand} legal</p>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Last updated {LEGAL.lastUpdated} · Operated by {LEGAL.entity}
        </p>
      </header>

      <article className="legal-doc mt-5 space-y-5">{children}</article>

      <section className="mt-8 rounded-3xl border border-border bg-card/70 p-5">
        <h2 className="font-display text-base font-bold">Other policies</h2>
        <ul className="mt-3 grid gap-1.5">
          {LEGAL_PAGES.map((p) => (
            <li key={p.to}>
              <Link
                to={p.to}
                className="text-[13px] font-semibold text-foreground/80 underline-offset-4 transition hover:text-primary hover:underline"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
          Questions? Email{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>{" "}
          — we reply within {LEGAL.supportResponseHours} hours.
        </p>
      </section>
    </AppShell>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card/60 p-5">
      <h2 className="font-display text-[15px] font-bold tracking-tight">{heading}</h2>
      <div className="mt-2 space-y-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1.5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
