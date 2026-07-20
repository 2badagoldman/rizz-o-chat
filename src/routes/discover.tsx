import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DEMO_HOSTS, tierLabel, type DemoHost } from "@/lib/demo-hosts";
import { Search, Sparkles, Users, Circle } from "lucide-react";
import rizzLogo from "@/assets/rizz-ai-logo.webp.asset.json";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Hosts — Rizz Social" },
      { name: "description", content: "Browse verified Hosts and their Friends Lists on Rizz Social." },
    ],
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

function Discover() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const hosts = useMemo(() => {
    const term = q.trim().toLowerCase();
    return DEMO_HOSTS.filter((h) => {
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
  }, [q, filter]);

  return (
    <AppShell footerNote={<>Hosts on Rizz Social are compensated partners.</>}>
      <header className="pt-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Discover</p>
        <h1 className="mt-1 text-2xl">Verified hosts, ready to chat.</h1>
      </header>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hosts, cities, interests…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
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

      <section className="mt-4 grid grid-cols-2 gap-3">
        {hosts.map((h) => (
          <HostCard key={h.id} host={h} />
        ))}
      </section>

      {hosts.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No hosts match — try a different filter.
        </p>
      ) : null}
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
        className="relative aspect-[3/4] w-full"
        style={{ backgroundImage: host.gradient, backgroundSize: "cover" }}
      >
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
