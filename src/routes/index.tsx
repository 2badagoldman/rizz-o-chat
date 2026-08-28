import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DemoChatProofs } from "@/components/DemoChatProofs";
import { getDemoProofs } from "@/lib/demo-proofs.functions";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Crown, Users, Circle, Search, ChevronDown, Volume2, Sparkles, Heart } from "lucide-react";

import { PeopleDiscovery } from "@/components/PeopleDiscovery";
import { DEMO_HOSTS, isFreeHost } from "@/lib/demo-hosts";
import { useShuffled } from "@/hooks/useShuffled";
import { hostAvatarMed, hostAvatarThumb } from "@/lib/host-avatars";
import { Waveform } from "@/components/chat/VoiceNote";
import { pageHead, faqLd, jsonLd, SITE_URL } from "@/lib/seo";
import { ShowcaseRail } from "@/components/ShowcaseRail";
import { TasteChat } from "@/components/TasteChat";

import { StoryRail } from "@/components/stories/StoryRail";
import { SwipeDeck } from "@/components/SwipeDeck";


const FAQS = [
  {
    q: "What is Crush?",
    a: "Meet your favorite exclusive creators on CRUSH. Members get 24/7 access to chat, connect, and enjoy one-on-one time with the creators they love.",
  },
  {
    q: "How much does Crush cost?",
    a: "Joining is free. Crush Gold is $9.99 per month and unlocks any creator's Friends List. Crush Diamond VIP is $24.99 per month and adds a diamond badge plus monthly coin drops. Coins for gifts are bought separately.",
  },
  {
    q: "Do creators send voice notes on Crush?",
    a: "Yes — voice notes are the signature Crush feature. Creators reply out loud, saying your name and answering what you actually asked, and you can hold the mic to send a voice note back.",
  },
  {
    q: "Are the creators on Crush real and verified?",
    a: "Yes. Every creator passes 18+ identity verification before they can earn, and all uploads are moderated before they appear publicly.",
  },
  {
    q: "Can I cancel my Crush membership any time?",
    a: "Yes. Memberships are monthly and can be cancelled at any time from your subscriptions page; access continues to the end of the paid month.",
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
      title: "Crush \u2014 She actually replies",
      description: "Meet your favorite exclusive creators on CRUSH. Members get 24/7 access to chat, connect, and enjoy one-on-one time with the creators they love.",
      keywords: "chat app, voice notes, voice messages, hear her voice, meet creators, exclusive creators, one on one chat, paid chat, creator subscriptions, social chat, 24/7 access",
    });
    return {
      ...base,
      scripts: [
        faqLd(FAQS),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Crush — exclusive creators",
          url: SITE_URL,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          about: "24/7 access to chat, connect, and enjoy one-on-one time with exclusive creators",
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
      <header className="pt-2 rise-in">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80 chip-shimmer">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Friends Always · Crush
          </span>
          {!authLoading && !user && (
            <div className="flex items-center gap-2">
              <Link to="/auth" className="text-xs font-semibold text-muted-foreground transition hover:text-foreground">
                Log in
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-black shadow-[0_10px_30px_-10px_rgba(255,255,255,0.5)] transition hover:scale-105 active:scale-95"
              >
                Join Free
              </Link>
            </div>
          )}
        </div>
        <h1 className="mt-3 font-display text-4xl leading-[1.02] font-extrabold tracking-tight">
          She actually{" "}
          <span className="text-gradient-brand italic">replies</span>.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Voice notes, photos, real conversation. Say something right now — free, no signup.
        </p>
      </header>

      {/* Creator rail — sunset rings, glowing online dots */}
      <section className="mt-4 rise-in">
        <div className="-mx-3 flex gap-4 overflow-x-auto px-3 pb-2 md:-mx-6 md:px-6">
          {online.map((h, i) => (
            <Link
              key={h.id}
              to="/host/$hostId"
              params={{ hostId: h.id }}
              className="shrink-0 text-center transition-transform hover:-translate-y-1"
              style={{ animation: `rise-in 600ms ${i * 45}ms cubic-bezier(.2,.8,.2,1) both` }}
            >
              <div className="relative">
                <span className={i === 0 ? "ring-sunset block" : "block rounded-[1.1rem] ring-1 ring-white/15"}>
                  <img
                    src={hostAvatarThumb(h.id)}
                    alt={h.name}
                    width={56}
                    height={56}
                    loading={i < 8 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={i < 4 ? "high" : "auto"}
                    className="block h-14 w-14 rounded-[0.9rem] object-cover"
                  />
                </span>
                <span className="dot-online absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-400" />
              </div>
              <p className="mt-1.5 w-14 truncate text-[10px] font-medium">{h.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Runway of real creators + real chats is rendered globally by AppShell */}



      {/* Search creators right from the hero — username, email or phone */}
      <div className="mt-3 w-full min-w-0 rise-in">
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

      {/* The wound, in one line. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-border bg-card/60 px-3.5 py-2.5 text-[12px] shadow-card backdrop-blur rise-in">
        <span className="text-muted-foreground">
          Instagram: seen, no reply. Tinder: no match. Hinge: silence.
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-primary">
          <Volume2 className="h-3.5 w-3.5" /> Crush: voice note back in seconds.
        </span>
      </div>

      {/* One-line entry points to the sales pages */}
      <div className="mt-2 flex flex-wrap gap-2 rise-in">
        <Link
          to="/voice-notes"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/60 px-3 py-1.5 text-[11px] font-semibold transition hover:border-primary"
        >
          <Volume2 className="h-3.5 w-3.5 text-primary" /> Hear her say your name
          <ArrowRight className="h-3 w-3 text-primary" />
        </Link>
        <Link
          to="/confidence"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/60 px-3 py-1.5 text-[11px] font-semibold transition hover:border-primary"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Boost your confidence
          <ArrowRight className="h-3 w-3 text-primary" />
        </Link>
        <Link
          to="/why-crush"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/60 px-3 py-1.5 text-[11px] font-semibold transition hover:border-primary"
        >
          <Heart className="h-3.5 w-3.5 text-primary" /> Tired of being ignored?
          <ArrowRight className="h-3 w-3 text-primary" />
        </Link>
      </div>

      {/* Swipe deck — like her or keep looking */}
      <section className="mt-6 rounded-3xl border border-border bg-card/60 p-4 rise-in">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Swipe</p>
            <h2 className="mt-0.5 truncate text-lg font-bold">Like her or keep looking</h2>
          </div>
          <Link
            to="/swipe"
            className="shrink-0 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-glow transition active:scale-95"
          >
            Full screen
          </Link>
        </div>
        <div className="mx-auto mt-3 w-full max-w-[720px]">
          <SwipeDeck />
        </div>
      </section>

      {/* Full proof grid: real creators, real chats */}
      <div className="mt-6 rise-in">

        <DemoChatProofs
          limit={12}
          title="Real conversations, real replies"
          subtitle="Actual chats between members and Crush creators"
        />
      </div>


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
        <div className="-mx-3 md:-mx-6 flex gap-3 overflow-x-auto px-3 md:px-6 pb-3">
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
                <span className="font-bold text-gradient-brand">{isFreeHost(h.id) ? "Free" : "View profile"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* One CTA, one job: get them to say something to her. */}
      <div className="mt-7 rise-in rise-in-3">
        {!authLoading && !user ? (
          <>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("taste-chat");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                el?.querySelector("input")?.focus({ preventScroll: true });
              }}
              className="btn-brand flex w-full items-center justify-center gap-3 !py-4 pulse-cta hover:btn-brand-hover"
            >
              {(proofAvatars[0] ?? hostAvatarThumb(featured[0]?.id ?? "")) ? (
                <img
                  src={proofAvatars[0] ?? hostAvatarThumb(featured[0]!.id)}
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 rounded-full border-2 border-white/70 object-cover"
                />
              ) : null}
              <span className="font-display text-base font-extrabold">Say Something</span>
              <Waveform active className="h-5 text-white/80" />
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              She's online right now. Free to start — Gold ($9.99/mo) unlocks any creator's Friends
              List.
            </p>
          </>
        ) : (
          <Link to="/discover" className="btn-brand flex items-center justify-center gap-2 hover:btn-brand-hover">
            Browse all creators <ArrowRight className="h-4 w-4" />
          </Link>
        )}
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
          Every creator gets a Friends List — think a class you teach. Start at 35% split; hit 100 Friends for <b>50%</b> and 500 for <b>65% forever</b>.
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
