import { PrismEmptyState } from "@/components/Prism";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DEMO_HOSTS, tierLabel, type DemoHost } from "@/lib/demo-hosts";
import { hostAvatarMed } from "@/lib/host-avatars";
import { Search, Users, Circle, Sparkles, X, ArrowUpDown } from "lucide-react";
import { useShuffled } from "@/hooks/useShuffled";
import rizzLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { RoomsShowcase } from "@/components/RoomsShowcase";
import { ShowcaseRail } from "@/components/ShowcaseRail";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/discover")({
  head: () => pageHead({
    path: "/discover",
    title: "Discover verified hosts \u2014 Crush",
    description: "Browse verified hosts, filter by tier, and find your next favorite chat. Join Friends Lists on Crush.",
  }),
  component: Discover,
});


const FILTERS: Array<{ key: "all" | DemoHost["tier"] | "online"; label: string }> = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "new", label: "New" },
  { key: "rising", label: "Rising" },
  { key: "popular", label: "Popular" },
  { key: "elite", label: "Elite" },
];

type SortKey = "featured" | "online" | "price-asc" | "price-desc" | "subscribers";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "Featured" },
  { key: "online", label: "Online first" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "subscribers", label: "Most subscribers" },
];

function Discover() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const shuffled = useShuffled(DEMO_HOSTS, 10_000);
  const term = q.trim().toLowerCase();
  const isFiltered = term.length > 0 || filter !== "all" || sort !== "featured";

  const hosts = useMemo(() => {
    // Reshuffling under an active search/sort would make results jump while the
    // user reads them, so only the untouched "Featured" view rotates.
    const base = sort === "featured" && !term ? shuffled : DEMO_HOSTS;

    const matched = base.filter((h) => {
      if (filter === "online" && !h.online) return false;
      if (filter !== "all" && filter !== "online" && h.tier !== filter) return false;
      if (!term) return true;
      return (
        h.name.toLowerCase().includes(term) ||
        h.handle.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term) ||
        h.interests.some((i) => i.toLowerCase().includes(term))
      );
    });

    const sorted = matched.slice();
    if (sort === "online") sorted.sort((a, b) => Number(b.online) - Number(a.online));
    if (sort === "price-asc") sorted.sort((a, b) => a.priceMonthly - b.priceMonthly);
    if (sort === "price-desc") sorted.sort((a, b) => b.priceMonthly - a.priceMonthly);
    if (sort === "subscribers") sorted.sort((a, b) => b.subscribers - a.subscribers);
    return sorted;
  }, [q, term, filter, sort, shuffled]);

  const reset = () => {
    setQ("");
    setFilter("all");
    setSort("featured");
  };

  return (
    <AppShell footerNote={<>Hosts on Crush are compensated partners.</>}>
      <header className="pt-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Discover</p>
        <h1 className="mt-1 text-2xl">Verified hosts, ready to chat.</h1>
      </header>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hosts, cities, interests…"
          aria-label="Search hosts, cities and interests"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div role="group" aria-label="Filter hosts" className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            style={{
              borderColor: filter === f.key ? "transparent" : "var(--color-border)",
              background: filter === f.key ? "var(--gradient-brand)" : "var(--color-card)",
              color: filter === f.key ? "white" : "var(--color-muted-foreground)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ShowcaseRail title="Showcase" subtitle="Best looks right now" limit={24} />

      <RoomsShowcase />


      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Hosts</p>
          <h2 className="mt-0.5 truncate text-lg font-bold">Meet your next favorite</h2>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground" aria-live="polite">
            {hosts.length} {hosts.length === 1 ? "host" : "hosts"}
            {isFiltered ? " match your search" : " available"}
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="sr-only">Sort hosts</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort hosts"
            className="max-w-[9.5rem] bg-transparent text-xs font-semibold text-foreground outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hosts.length === 0 ? (
        <PrismEmptyState
          className="mt-6"
          icon={<Sparkles className="h-6 w-6" />}
          title="No hosts match"
          description={
            term
              ? <>Nothing matched &ldquo;{q.trim()}&rdquo;. Try a different name, city, or interest.</>
              : "Try a different filter to see more friends."
          }
          action={
            <button
              type="button"
              onClick={reset}
              className="mt-1 rounded-full bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow-glow transition active:scale-95"
            >
              Clear search &amp; filters
            </button>
          }
        />
      ) : (
        <section className="mt-3 grid grid-cols-2 gap-3">
          {hosts.map((h) => (
            <HostCard key={h.id} host={h} />
          ))}
        </section>
      )}

    </AppShell>
  );
}


function HostCard({ host }: { host: DemoHost }) {
  return (
    <Link
      to="/host/$hostId"
      params={{ hostId: host.id }}
      className="group overflow-hidden rounded-3xl border border-border bg-card transition active:scale-[0.98]"
    >
      <div
        className="relative aspect-[3/4] w-full overflow-hidden"
        style={{ background: host.gradient }}
      >
        <img
          src={hostAvatarMed(host.id)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity opacity-95 transition group-hover:scale-[1.03] group-hover:mix-blend-normal"
        />

        <div className="absolute inset-0" style={{ background: host.gradient, mixBlendMode: "soft-light", opacity: 0.55 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-2 top-2 flex items-center justify-between">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {tierLabel(host.tier)}
          </span>
          {host.online ? (
            <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              <Circle className="h-2 w-2 fill-success text-success" /> Online
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-2 bottom-2 text-white">
          <p className="text-base font-bold leading-tight">
            {host.name}, {host.age}
          </p>
          <p className="text-[11px] opacity-90">{host.city}</p>
        </div>
        {/* photo count / video badge */}
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
          {host.hasVideo ? (
            <span className="rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              Video
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" /> {host.subscribers}
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold">
          <img src={rizzLogo.url} alt="" className="h-3.5 w-3.5 rounded-full" />
          ${host.priceMonthly}/mo
        </div>
      </div>
    </Link>
  );
}
