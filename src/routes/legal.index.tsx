import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LEGAL, LEGAL_PAGES } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/")({
  head: () => pageHead({
    path: "/legal",
    title: "Policies & Legal Center \u2014 Crush Chat",
    description: "Crush Chat legal center: terms of service, privacy policy, refund and cancellation policy, billing terms, acceptable use, creator payouts, cookies, DMCA and business contact details.",
  }),
  component: LegalIndex,
});

function LegalIndex() {
  return (
    <AppShell>
      <header className="overflow-hidden rounded-3xl border border-border bg-card/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Legal center</p>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight">Policies & business details</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything that governs your use of {LEGAL.productName} — written in plain language, kept current, and
          maintained by {LEGAL.entity}.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[`${LEGAL.minAge}+ only`, "Secure card payments via Stripe", "No card data stored by us"].map((t) => (
            <span key={t} className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10.5px] font-semibold">
              {t}
            </span>
          ))}
        </div>
      </header>

      <ul className="mt-4 space-y-2.5">
        {LEGAL_PAGES.map((p) => (
          <li key={p.to}>
            <Link
              to={p.to}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 p-4 transition hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="min-w-0">
                <span className="block text-[14.5px] font-bold">{p.title}</span>
                <span className="mt-0.5 block text-[12px] text-muted-foreground">{p.blurb}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-3xl border border-border bg-card/60 p-5 text-[13px] leading-relaxed text-muted-foreground">
        <h2 className="font-display text-[15px] font-bold text-foreground">Merchant of record</h2>
        <p className="mt-2">
          {LEGAL.entity}
          <br />
          {LEGAL.addressLines.map((l) => (
            <span key={l}>
              {l}
              <br />
            </span>
          ))}
          Support:{" "}
          <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          <br />
          Card statements appear as <b className="text-foreground">{LEGAL.statementDescriptor}</b>.
        </p>
      </section>
    </AppShell>
  );
}
