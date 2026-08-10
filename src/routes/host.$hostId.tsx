import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DEMO_HOSTS, tierBand, tierLabel, isAiHost } from "@/lib/demo-hosts";
import { hostAvatar } from "@/lib/host-avatars";
import { useAuth } from "@/lib/auth";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useGoldAccess } from "@/hooks/useGoldAccess";
import { useIosBillingRestricted } from "@/hooks/useNative";
import { SafetyMenu } from "@/components/SafetyMenu";

import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { pageHead } from "@/lib/seo";


import { ArrowLeft, Lock, Play, MessageCircle, Gift, Users, Circle, Check, X, Heart } from "lucide-react";

const UUID_RE = /^[a-f0-9-]{36}$/i;

export const Route = createFileRoute("/host/$hostId")({
  head: ({ params }) => {
    const h = DEMO_HOSTS.find((x) => x.id === params.hostId);
    const url = `https://rizzlachat.com/host/${params.hostId}`;
    const title = h ? `${h.name} — Chat on Crush` : "Creator — Crush";
    const desc = h?.tagline ?? "Meet a verified creator on Crush. Join their Friends List and start chatting.";
    return {
      ...pageHead({
        path: `/host/${params.hostId}`,
        title,
        description: desc,
        type: "profile",
        imageAlt: h ? `${h.name} on Crush` : undefined,
      }),
      scripts: h
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: `${h.name} — Friends List`,
                description: h.tagline,
                brand: { "@type": "Brand", name: "Crush" },
                url,
              }),
            },
          ]
        : undefined,
    };
  },
  component: HostProfile,
});



function HostProfile() {
  const { hostId } = Route.useParams();
  const creator = useMemo(() => DEMO_HOSTS.find((h) => h.id === hostId), [hostId]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(500);
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const { hasGold } = useGoldAccess();
  const iosRestricted = useIosBillingRestricted();


  if (!creator) {
    return (
      <AppShell>
        <div className="mt-16 text-center">
          <h1 className="text-lg">Creator not found</h1>
          <Link to="/discover" className="btn-brand mt-4 inline-flex">Browse creators</Link>
        </div>
      </AppShell>
    );
  }

  const aiHost = isAiHost(creator.id);
  const slides: Array<{ kind: "hero" | "video" | "locked" | "photo"; label?: string }> = [
    { kind: "hero" },
    ...(creator.hasVideo ? [{ kind: "video" as const, label: "Video loop" }] : []),
    // AI hosts show all photos unlocked so members can preview the vibe.
    ...(aiHost
      ? [
          { kind: "photo" as const, label: `Photo 2 of ${creator.photoCount}` },
          { kind: "photo" as const, label: `Photo 3 of ${creator.photoCount}` },
          { kind: "photo" as const, label: `Photo 4 of ${creator.photoCount}` },
        ]
      : [
          { kind: "locked" as const, label: "Photo 3 of " + creator.photoCount },
          { kind: "locked" as const, label: "Photo 7 of " + creator.photoCount },
        ]),
  ];

  const hostIsReal = UUID_RE.test(creator.id);

  const onSubscribe = () => {
    if (!user) return navigate({ to: "/auth" });
    // Friends Lists are Crush Gold only.
    if (!hasGold) return navigate({ to: "/upgrade" });
    if (!hostIsReal) {
      alert(`${creator.name} is a demo profile — checkout will unlock once real creators sign up.`);
      return;
    }
    openCheckout({
      kind: "friends_list",
      hostId: creator.id,
      hostName: creator.name,
    });
  };

  const onTip = () => {
    if (!user) return navigate({ to: "/auth" });
    if (!hostIsReal) {
      alert(`${creator.name} is a demo profile — tips unlock once real creators sign up.`);
      return;
    }
    setTipOpen(true);
  };

  const sendTip = () => {
    setTipOpen(false);
    openCheckout({ kind: "tip", hostId: creator.id, hostName: creator.name, amountCents: tipAmount });
  };

  return (
    <AppShell hideNav hideDock>
      <Link
        to="/discover"
        aria-label="Close profile and return to Discover"
        className="fixed right-4 top-20 z-[100] inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card/95 px-4 text-sm font-bold shadow-card backdrop-blur transition hover:scale-105 hover:bg-primary/10 active:scale-95"
      >
        <X className="h-5 w-5" />
        Close
      </Link>

      <div className="fixed left-4 top-20 z-[100]">
        <SafetyMenu
          userId={hostIsReal ? creator.id : null}
          name={creator.name}
          context="creator profile"
          className="h-12 w-12 shadow-card backdrop-blur"
        />
      </div>



      <div className="-mx-4">
        {/* Carousel */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
          {/* Full-bleed portrait — blurred when locked */}
          <img loading="lazy" decoding="async"
            src={hostAvatar(creator.id)}
            alt={creator.name}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
              slides[slide].kind === "locked" ? "scale-110 blur-2xl brightness-75" : slides[slide].kind === "video" ? "brightness-90" : ""
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* Slide overlay content */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {slides[slide].kind === "video" ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur">
                  <Play className="h-6 w-6 fill-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Preview loop</p>
              </div>
            ) : slides[slide].kind === "locked" ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur">
                  <Lock className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Locked · {slides[slide].label}</p>
              </div>
            ) : null}
          </div>


          {/* Prev / next tap zones */}
          <button
            aria-label="Previous"
            onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
            className="absolute inset-y-0 left-0 z-10 w-1/3"
          />
          <button
            aria-label="Next"
            onClick={() => setSlide((s) => (s + 1) % slides.length)}
            className="absolute inset-y-0 right-0 z-10 w-1/3"
          />

          {/* Top row */}
          <div className="absolute inset-x-3 top-3 z-30 flex items-center justify-between">
            <Link to="/chat/$hostId" params={{ hostId: creator.id }} aria-label="Back to chat" className="grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:scale-105">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {tierLabel(creator.tier)}
              </span>
              {creator.online ? (
                <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  <Circle className="h-2 w-2 fill-success text-success" /> Online
                </span>
              ) : null}
            </div>
          </div>

          {/* Slide dots */}
          <div className="absolute inset-x-0 bottom-[128px] z-30 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === slide ? 20 : 6,
                  background: i === slide ? "white" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>

          {/* In-image CTA — keeps eyes on the creator while deciding */}
          <div className="absolute inset-x-0 bottom-0 z-30 p-3">
            <div className="rounded-2xl border border-white/15 bg-black/55 p-3 text-white shadow-2xl backdrop-blur-xl">
              <div className="mb-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold leading-tight">
                    {creator.name}, {creator.age}
                  </p>
                  <p className="truncate text-[11px] opacity-80">{creator.city} · {creator.subscribers} Friends</p>
                </div>
                {iosRestricted && !aiHost ? null : (
                  <p className="whitespace-nowrap text-lg font-bold">
                    {aiHost ? (
                      <span className="text-gradient-brand">Free</span>
                    ) : (
                      <>
                        ${creator.priceMonthly}
                        <span className="text-[11px] font-normal opacity-80">/mo</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {aiHost ? (
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem(`rizzla:welcome:${creator.id}`, "1");
                      }
                      navigate({ to: "/chat/$hostId", params: { hostId: creator.id } });
                    }}
                    className="btn-brand flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <Heart className="h-4 w-4 fill-white" />
                    Join {creator.name}'s Friends List — Free
                  </button>
                ) : iosRestricted ? (
                  <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-center text-[12px] font-semibold leading-snug">
                    Friends List access already on your account works here.
                  </div>
                ) : (
                  <button
                    onClick={onSubscribe}
                    className="btn-brand flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <img loading="lazy" decoding="async" src={rizzAiLogo.url} alt="" className="h-4 w-4 rounded-full" />
                    {hasGold ? "Unlock Friends List" : "Get Crush Gold to Unlock"}
                  </button>
                )}
                {iosRestricted ? null : (
                  <button onClick={onTip} aria-label="Send tip" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20">
                    <Gift className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => navigate({ to: "/chat/$hostId", params: { hostId: creator.id } })}
                  aria-label="Message"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>


      {/* Meta */}
      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">
            {creator.name}, {creator.age}
          </h1>
          <span className="text-xs text-muted-foreground">{creator.handle}</span>
        </div>
        <p className="text-sm text-muted-foreground">{creator.city}</p>
        <p className="mt-3 text-sm">{creator.tagline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {creator.interests.map((i) => (
            <span key={i} className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px]">
              {i}
            </span>
          ))}
        </div>
      </section>

      {/* Sample locked message tease */}
      <section className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Latest to Friends</p>
        <div className="mt-2 rounded-2xl bg-background/50 p-3">
          <p className="text-sm">&ldquo;{creator.teaser}&rdquo;</p>
        </div>
        <div className="mt-3 space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2 rounded-2xl bg-background/50 p-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div className="h-2 flex-1 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Friends List includes</p>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            <>1:1 DMs with {creator.name}</>,
            <>Group room with other Friends</>,
            <>All posts, photos & voice notes</>,
            <>Send animated gifts</>,
          ].map((line, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" /> {creator.subscribers} active Friends · Tier band {tierBand(creator.tier)}
        </p>
      </section>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        {creator.id === "demo-jen"
          ? "Jen is our founding creator — free to chat while we test."
          : "Cancel anytime · Chat access continues for 30 minutes after cancel."}
      </p>



      {tipOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setTipOpen(false)}>
          <div className="w-full max-w-[480px] rounded-t-3xl border-t border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Send a tip to</p>
            <h3 className="mt-1 text-lg font-bold">{creator.name}</h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((c) => (
                <button
                  key={c}
                  onClick={() => setTipAmount(c)}
                  className={`rounded-2xl border px-2 py-3 text-sm font-semibold ${tipAmount === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}
                >
                  ${(c / 100).toFixed(0)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs text-muted-foreground">Custom amount (USD)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={(tipAmount / 100).toString()}
              onChange={(e) => setTipAmount(Math.max(100, Math.min(50000, Math.round(Number(e.target.value) * 100))))}
              className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button onClick={sendTip} className="btn-brand mt-4 w-full">Send ${(tipAmount / 100).toFixed(2)}</button>
          </div>
        </div>
      ) : null}

      {checkoutElement}
    </AppShell>
  );
}
