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
}: {
  limit?: number;
  title?: string;
  subtitle?: string;
  showCta?: boolean;
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
