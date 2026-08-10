import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Crown, Users, Circle } from "lucide-react";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { useShuffled } from "@/hooks/useShuffled";
import { hostAvatarMed, hostAvatarThumb } from "@/lib/host-avatars";
import { pageHead } from "@/lib/seo";
import { ShowcaseRail } from "@/components/ShowcaseRail";
import { StoryRail } from "@/components/stories/StoryRail";


export const Route = createFileRoute("/")({
  head: () => pageHead({
    path: "/",
    title: "Crush \u2014 Real chats with verified creators, dates, and friends",
    description: "Chat, date, and make friends on Crush. Verified creators, private Friends Lists, secure payments, and instant DMs. Join free.",
    keywords: "chat app, dating app, friends app, meet women, verified creators, paid chat, creator subscriptions, social chat",
  }),
  component: Home,
});


function Home() {
  const { user, loading: authLoading } = useAuth();
  const onlinePool = useMemo(() => DEMO_HOSTS.filter((h) => h.online), []);
  const onlineShuffled = useShuffled(onlinePool, 10_000);
  const online = onlineShuffled.slice(0, 12);
  const featured = useShuffled(DEMO_HOSTS, 10_000);

  return (
    <AppShell>
      <header className="pt-6 rise-in">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80 chip-shimmer">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Friends Always · Crush
        </span>
        <h1 className="mt-3 text-[2.6rem] leading-[1.02] font-display font-extrabold">
          Real chats with{" "}
          <span className="text-gradient-brand">verified creators</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Every creator runs a Friends List — a little chapter of our family tree. Subscribe, meet the creator, find your Crush.
        </p>
      </header>

      {/* Stories */}
      <StoryRail />

      {/* Showcase reel */}
      <ShowcaseRail title="Showcase" subtitle="Today's best looks" limit={25} />

      {/* Online now rail */}
      <section className="mt-7 rise-in rise-in-1">

        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-display font-bold">Online now</h2>
          <Link to="/discover" className="text-[11px] text-muted-foreground hover:text-primary">See all</Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3">
          {online.map((h, i) => (
            <Link
              key={h.id}
              to="/host/$hostId"
              params={{ hostId: h.id }}
              className="w-16 shrink-0 text-center transition-transform hover:-translate-y-0.5"
              style={{ animation: `rise-in 600ms ${i * 40}ms cubic-bezier(.2,.8,.2,1) both` }}
            >
              <div className="relative">
                <span className="ring-story mx-auto block h-16 w-16">
                  <img
                    src={hostAvatarThumb(h.id)}
                    alt={h.name}
                    width={64}
                    height={64}
                    loading={i < 6 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={i < 4 ? "high" : "auto"}
                    className="block h-full w-full rounded-full object-cover"
                  />
                </span>
                <span className="absolute bottom-0 right-1 grid h-4 w-4 place-items-center rounded-full bg-card">
                  <Circle className="h-2 w-2 fill-success text-success" />
                </span>
              </div>
              <p className="mt-1 truncate text-[10px] font-medium">{h.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="mt-6 rise-in rise-in-2">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-display font-bold">Featured Creators</h2>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            The family tree
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featured.map((h, i) => (
            <Link
              key={h.id}
              to="/host/$hostId"
              params={{ hostId: h.id }}
              className="card-story overflow-hidden hover:card-story-hover"
              style={{ transitionDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden" style={{ background: h.gradient }}>
                <img
                  src={hostAvatarMed(h.id)}
                  alt={h.name}
                  width={400}
                  height={500}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={i < 2 ? "high" : "auto"}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0" style={{ background: h.gradient, mixBlendMode: "soft-light", opacity: 0.5 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground backdrop-blur">
                  Friends List
                </span>
                <div className="absolute inset-x-2 bottom-2 text-white">
                  <p className="font-display text-sm font-bold">{h.name}, {h.age}</p>
                  <p className="text-[10px] opacity-90">{h.city}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" /> {h.subscribers}
                </span>
                <span className="font-bold text-gradient-brand">${h.priceMonthly}/mo</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-3 rise-in rise-in-3">
        <Link to="/discover" className="btn-brand flex items-center justify-center gap-2 hover:btn-brand-hover">
          Browse all creators <ArrowRight className="h-4 w-4" />
        </Link>
        {!authLoading && !user ? (
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card/80 px-5 py-3 text-sm font-semibold backdrop-blur transition-transform hover:scale-[1.01]"
          >
            Sign in or create account
          </Link>
        ) : null}
      </div>

      {/* Become a creator — warm creator studio invite */}
      <section
        className="mt-7 overflow-hidden rounded-3xl border p-5 shadow-card rise-in rise-in-4"
        style={{ background: "var(--host-soft)", borderColor: "var(--host-primary)" }}
      >
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 float-soft" style={{ color: "var(--host-primary)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--host-primary)" }}>
            For creators
          </p>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold">Run your own class of Friends.</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Every creator gets a Friends List — think a class you teach. Start at 35% split; hit 100 Friends and flip to <b>65% forever</b>.
        </p>
        <Link
          to="/host/onboarding"
          className="btn-host mt-4 inline-flex items-center gap-2"
        >
          Apply as a Creator <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AppShell>
  );
}
