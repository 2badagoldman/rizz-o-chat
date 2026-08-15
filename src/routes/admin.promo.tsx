import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { hostAvatarThumb } from "@/lib/host-avatars";
import { PROMO_CATEGORIES, PROMO_SCRIPTS, type PromoScript } from "@/lib/promo-scripts";

export const Route = createFileRoute("/admin/promo")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Promo Chat Screenshots — Crush Admin" },
    ],
  }),
  component: AdminPromo,
});

function PromoCard({ s }: { s: PromoScript }) {
  const avatar = hostAvatarThumb(s.creatorId);
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
        {avatar ? (
          <img
            src={avatar}
            alt={s.name}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20" />
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-bold">
            {s.name}
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
          </p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
            Online now
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {s.category}
        </span>
      </div>

      <div className="space-y-2 p-4">
        {s.lines.map((l, i) => (
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
      </div>

      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">{s.hook}</p>
    </article>
  );
}

function AdminPromo() {
  const [cat, setCat] = useState<string>("All");

  const shown = useMemo(
    () => (cat === "All" ? PROMO_SCRIPTS : PROMO_SCRIPTS.filter((s) => s.category === cat)),
    [cat],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-display font-bold">Promo chat screenshots</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PROMO_SCRIPTS.length} ready-to-capture conversation mockups between creators and members.
          Screenshot any card for ads, App Store shots or social posts.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["All", ...PROMO_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((s) => (
          <PromoCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
