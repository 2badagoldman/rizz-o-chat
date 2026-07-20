import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Crown, Users, Circle } from "lucide-react";
import { DEMO_HOSTS } from "@/lib/demo-hosts";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const online = DEMO_HOSTS.filter((h) => h.online).slice(0, 6);
  const featured = DEMO_HOSTS.slice(0, 4);

  return (
    <AppShell>
      <header className="pt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Rizz Social
        </p>
        <h1 className="mt-1 text-3xl leading-tight">
          Real chats with <span className="text-gradient-brand">verified hosts</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Subscribe to a Friends List. Meet the host. Bring your rizz.
        </p>
      </header>

      {/* Online now rail */}
      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Online now</h2>
          <Link to="/discover" className="text-[11px] text-muted-foreground">See all</Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {online.map((h) => (
            <Link
              key={h.id}
              to="/host/$hostId"
              params={{ hostId: h.id }}
              className="w-16 shrink-0 text-center"
            >
              <div className="relative">
                <div
                  className="mx-auto h-16 w-16 rounded-full ring-2 ring-primary"
                  style={{ background: h.gradient }}
                />
                <span className="absolute bottom-0 right-1 grid h-4 w-4 place-items-center rounded-full bg-card">
                  <Circle className="h-2 w-2 fill-success text-success" />
                </span>
              </div>
              <p className="mt-1 truncate text-[10px]">{h.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">Featured Hosts</h2>
        <div className="grid grid-cols-2 gap-3">
          {featured.map((h) => (
            <Link
              key={h.id}
              to="/host/$hostId"
              params={{ hostId: h.id }}
              className="overflow-hidden rounded-3xl border border-border bg-card"
            >
              <div className="relative aspect-[4/5]" style={{ background: h.gradient }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                <div className="absolute inset-x-2 bottom-2 text-white">
                  <p className="text-sm font-bold">{h.name}, {h.age}</p>
                  <p className="text-[10px] opacity-90">{h.city}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> {h.subscribers}</span>
                <span className="font-semibold">${h.priceMonthly}/mo</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-3">
        <Link to="/discover" className="btn-brand flex items-center justify-center gap-2">
          Browse all hosts <ArrowRight className="h-4 w-4" />
        </Link>
        {!user ? (
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-[14px] border border-border bg-card px-5 py-3 text-sm font-semibold"
          >
            Sign in or create account
          </Link>
        ) : null}
      </div>

      {/* Become a host — warm creator studio invite */}
      <section className="mt-6 overflow-hidden rounded-3xl border p-5" style={{ background: "var(--host-soft)", borderColor: "var(--host-primary)" }}>
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" style={{ color: "var(--host-primary)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--host-primary)" }}>
            For creators
          </p>
        </div>
        <h3 className="mt-2 text-lg font-bold">Run your own class of Friends.</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Every creator gets a Friends List — think a class you teach. Start at 35% split; hit 100 Friends and flip to <b>65% forever</b>.
        </p>
        <Link
          to="/host/onboarding"
          className="btn-host mt-4 inline-flex items-center gap-2"
        >
          Apply as a Host <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AppShell>
  );
}
