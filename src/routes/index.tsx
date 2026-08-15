import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DemoChatProofs } from "@/components/DemoChatProofs";
import { getDemoProofs } from "@/lib/demo-proofs.functions";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Crown, Users, Circle, Search, ChevronDown } from "lucide-react";
import { PeopleDiscovery } from "@/components/PeopleDiscovery";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { useShuffled } from "@/hooks/useShuffled";
import { hostAvatarMed, hostAvatarThumb } from "@/lib/host-avatars";
import { pageHead, faqLd, jsonLd, SITE_URL } from "@/lib/seo";
import { ShowcaseRail } from "@/components/ShowcaseRail";
import { TasteChat } from "@/components/TasteChat";

import { StoryRail } from "@/components/stories/StoryRail";

const FAQS = [
  {
    q: "What is Crush?",
    a: "Crush is an 18+ social chat app where verified creators run private Friends Lists. Members subscribe to DM their favourite creators, join city rooms, and send gifts.",
  },
  {
    q: "How much does Crush cost?",
    a: "Joining is free. Crush Gold is $9.99 per week and unlocks any creator's Friends List. Crush Diamond VIP is $19.99 per week and adds a diamond badge plus weekly coin drops. Coins for gifts are bought separately.",
  },
  {
    q: "Are the creators on Crush real and verified?",
    a: "Yes. Every creator passes 18+ identity verification before they can earn, and all uploads are moderated before they appear publicly.",
  },
  {
    q: "Can I cancel my Crush membership any time?",
    a: "Yes. Memberships are weekly and can be cancelled at any time from your subscriptions page; access continues to the end of the paid week.",
  },
  {
    q: "Is Crush available on iPhone and Android?",
    a: "Crush works in any mobile browser and installs to your home screen as an app, with native iOS and Android builds rolling out.",
  },
];

export const Route = createFileRoute("/")({
  head: () => {
    const base = pageHead({
      path: "/",
      title: "Crush \u2014 Real chats with your verified favourite creators",
      description: "Chat, date, and make friends on Crush with your verified favourite creators. Private Friends Lists, secure payments, and instant DMs. Join free.",
      keywords: "chat app, dating app, friends app, meet women, verified creators, paid chat, creator subscriptions, social chat",
    });
    return {
      ...base,
      scripts: [
        faqLd(FAQS),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Crush — verified creators",
          url: SITE_URL,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          about: "Paid chat and Friends Lists with verified 18+ creators",
        }),
      ],
    };
  },
  component: Home,
});



function Home() {
  const { user, loading: authLoading } = useAuth();
  const onlinePool = useMemo(() => DEMO_HOSTS.filter((h) => h.online), []);
  const onlineShuffled = useShuffled(onlinePool, 45_000);
  const online = onlineShuffled.slice(0, 12);
  const featured = useShuffled(DEMO_HOSTS, 45_000);
  const [searchOpen, setSearchOpen] = useState(false);
  const [proofAvatars, setProofAvatars] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    getDemoProofs({ data: { limit: 3 } })
      .then((rows) => {
        if (alive) setProofAvatars((rows ?? []).map((r) => r.image).filter(Boolean));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);


  return (
    <AppShell>
      <header className="pt-6 rise-in">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80 chip-shimmer">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Friends Always · Crush
        </span>
        <h1 className="mt-3 text-[2.6rem] leading-[1.02] font-display font-extrabold">
          Send a message.{" "}
          <span className="text-gradient-brand">Get a real reply</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Try it right now — free, no signup. Then subscribe to the creator you actually clicked with.
        </p>
      </header>

      {/* Search creators right from the hero — username, email or phone */}
      <div className="mt-4 rise-in">
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-expanded={searchOpen}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-3.5 py-2.5 text-left shadow-card backdrop-blur transition hover:border-primary/50 active:scale-[0.99]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-glow">
            <Search className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold">Search creators</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Username, email or phone — or just watch who's joining
            </span>
          </span>
          <span className="flex -space-x-2">
            {(proofAvatars.length ? proofAvatars : online.slice(0, 3).map((h) => hostAvatarThumb(h.id)))
              .slice(0, 3)
              .map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  aria-hidden
                  width={24}
                  height={24}
                  loading="lazy"
                  className="h-6 w-6 rounded-full border-2 border-card object-cover"
                />
              ))}
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${searchOpen ? "rotate-180" : ""}`}
          />
        </button>

        <PeopleDiscovery inline open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>


      {/* The aha moment: taste the conversation before any paywall */}
      <TasteChat />

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

      <div className="mt-7 grid gap-2 rise-in rise-in-3">
        {!authLoading && !user ? (
          <>
            <Link to="/auth" className="btn-brand flex items-center justify-center gap-2 hover:btn-brand-hover">
              Join free & keep chatting <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-center text-[11px] text-muted-foreground">
              Free to join. Gold ($9.99/wk) unlocks any creator's Friends List — cancel anytime.
            </p>
          </>
        ) : (
          <Link to="/discover" className="btn-brand flex items-center justify-center gap-2 hover:btn-brand-hover">
            Browse all creators <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {!authLoading && !user ? (
          <Link to="/discover" className="text-center text-xs font-medium text-muted-foreground hover:text-primary">
            Or browse all creators
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

      {/* FAQ — matches the FAQPage structured data in head() */}
      <section className="mt-7 rise-in rise-in-4">
        <h2 className="font-display text-lg font-bold">Crush FAQ</h2>
        <div className="mt-3 grid gap-2">
          {FAQS.map((f) => (
            <details key={f.q} className="rounded-2xl border border-border bg-card/70 px-4 py-3 backdrop-blur">
              <summary className="cursor-pointer list-none text-sm font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <DemoChatProofs limit={12} />
    </AppShell>

  );
}
