import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { getDemoProofs, type DemoProof } from "@/lib/demo-proofs.functions";

/**
 * Proof-of-concept screenshots: a large creator photo with her name and a real
 * 4-message exchange with a member. Used on the marketing home page and in the
 * admin demo workflow.
 */
export function DemoChatProofs({
  limit = 6,
  title = "Real conversations, real replies",
  subtitle = "Actual chats between members and Crush creators",
  showCta = true,
  variant = "grid",
  lineLimit,
}: {
  limit?: number;
  title?: string;
  subtitle?: string;
  showCta?: boolean;
  /** "rail" renders a compact horizontal scroller that fits above the fold. */
  variant?: "grid" | "rail";
  lineLimit?: number;
}) {
  const [proofs, setProofs] = useState<DemoProof[]>([]);

  useEffect(() => {
    let alive = true;
    getDemoProofs({ data: { limit } })
      .then((rows) => {
        if (alive) setProofs(rows ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [limit]);

  if (proofs.length === 0) return null;

  if (variant === "rail") {
    return (
      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-display font-bold">{title}</h2>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Swipe
          </span>
        </div>
        <div className="-mx-4 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
          {proofs.map((p) => (
            <article
              key={p.id}
              className="w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <div className="relative h-20 w-full overflow-hidden">
                <img
                  src={p.image}
                  alt={`${p.name}, Crush creator`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                  <p className="flex items-center gap-1 text-[13px] font-display font-bold text-white">
                    {p.name}, {p.age}
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </p>
                </div>
                <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Online
                </span>
              </div>
              <div className="space-y-1.5 p-2.5">
                {p.lines.slice(0, lineLimit ?? 2).map((l, i) => (
                  <div key={i} className={`flex ${l.from === "member" ? "justify-end" : "justify-start"}`}>
                    <p
                      className={`max-w-[88%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-snug ${
                        l.from === "member"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm border border-border bg-muted/60 text-foreground"
                      }`}
                    >
                      {l.text}
                    </p>
                  </div>
                ))}
                {showCta ? (
                  <Link
                    to="/auth"
                    className="mt-1.5 block rounded-xl bg-primary px-3 py-1.5 text-center text-[11px] font-bold text-primary-foreground"
                  >
                    Message {p.name} free
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>


      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {proofs.map((p) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <img
                src={p.image}
                alt={`${p.name}, Crush creator`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4">
                <p className="flex items-center gap-1.5 text-lg font-display font-bold text-white">
                  {p.name}, {p.age}
                  <BadgeCheck className="h-4 w-4 text-primary" />
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
                  {p.tagline}
                </p>
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                Online
              </span>
            </div>

            <div className="space-y-2 p-4">
              {p.lines.map((l, i) => (
                <div key={i} className={`flex ${l.from === "member" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
                      l.from === "member"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-muted/60 text-foreground"
                    }`}
                  >
                    {l.text}
                  </p>
                </div>
              ))}
              {showCta ? (
                <Link
                  to="/auth"
                  className="mt-3 block rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground"
                >
                  Message {p.name} free
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
