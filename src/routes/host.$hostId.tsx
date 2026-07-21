import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DEMO_HOSTS, tierBand, tierLabel } from "@/lib/demo-hosts";
import { useAuth } from "@/lib/auth";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

import { ArrowLeft, Lock, Play, MessageCircle, Gift, Users, Circle, Check, X } from "lucide-react";

const UUID_RE = /^[a-f0-9-]{36}$/i;

export const Route = createFileRoute("/host/$hostId")({
  head: ({ params }) => {
    const h = DEMO_HOSTS.find((x) => x.id === params.hostId);
    return {
      meta: [
        { title: h ? `${h.name} — Rizz Social` : "Host — Rizz Social" },
        { name: "description", content: h?.tagline ?? "Meet a verified Host on Rizz Social." },
      ],
    };
  },
  component: HostProfile,
});

function HostProfile() {
  const { hostId } = Route.useParams();
  const host = useMemo(() => DEMO_HOSTS.find((h) => h.id === hostId), [hostId]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(500);
  const { openCheckout, checkoutElement } = useStripeCheckout();

  if (!host) {
    return (
      <AppShell>
        <div className="mt-16 text-center">
          <h1 className="text-lg">Host not found</h1>
          <Link to="/discover" className="btn-brand mt-4 inline-flex">Browse hosts</Link>
        </div>
      </AppShell>
    );
  }

  const slides: Array<{ kind: "hero" | "video" | "locked"; label?: string }> = [
    { kind: "hero" },
    ...(host.hasVideo ? [{ kind: "video" as const, label: "Video loop" }] : []),
    { kind: "locked", label: "Photo 3 of " + host.photoCount },
    { kind: "locked", label: "Photo 7 of " + host.photoCount },
  ];

  const hostIsReal = UUID_RE.test(host.id);

  const onSubscribe = () => {
    if (!user) return navigate({ to: "/auth" });
    if (!hostIsReal) {
      alert(`${host.name} is a demo profile — checkout will unlock once real hosts sign up.`);
      return;
    }
    openCheckout({
      kind: "friends_list",
      hostId: host.id,
      hostName: host.name,
    });
  };

  const onTip = () => {
    if (!user) return navigate({ to: "/auth" });
    if (!hostIsReal) {
      alert(`${host.name} is a demo profile — tips unlock once real hosts sign up.`);
      return;
    }
    setTipOpen(true);
  };

  const sendTip = () => {
    setTipOpen(false);
    openCheckout({ kind: "tip", hostId: host.id, hostName: host.name, amountCents: tipAmount });
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

      <div className="-mx-4">
        {/* Carousel */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <div
            className="absolute inset-0 transition-transform duration-300"
            style={{ backgroundImage: host.gradient, backgroundSize: "cover" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
          </div>

          {/* Slide overlay content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {slides[slide].kind === "hero" ? (
              <div className="text-center">
                <div
                  className="mx-auto h-24 w-24 overflow-hidden rounded-full"
                  style={{ boxShadow: `0 10px 40px -6px ${host.accent}80` }}
                >
                  <img src={rizzAiLogo.url} alt={host.name} className="h-full w-full object-cover" />
                </div>
              </div>

            ) : slides[slide].kind === "video" ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <Play className="h-6 w-6 fill-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Preview loop</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <Lock className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Locked · {slides[slide].label}</p>
              </div>
            )}
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
            <Link to="/discover" aria-label="Back to discover" className="grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:scale-105">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {tierLabel(host.tier)}
              </span>
              {host.online ? (
                <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  <Circle className="h-2 w-2 fill-success text-success" /> Online
                </span>
              ) : null}
            </div>
          </div>

          {/* Slide dots */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
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
        </div>
      </div>

      {/* Meta */}
      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">
            {host.name}, {host.age}
          </h1>
          <span className="text-xs text-muted-foreground">{host.handle}</span>
        </div>
        <p className="text-sm text-muted-foreground">{host.city}</p>
        <p className="mt-3 text-sm">{host.tagline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {host.interests.map((i) => (
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
          <p className="text-sm">&ldquo;{host.teaser}&rdquo;</p>
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
            <>1:1 DMs with {host.name}</>,
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
          <Users className="h-3 w-3" /> {host.subscribers} active Friends · Tier band {tierBand(host.tier)}
        </p>
      </section>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-border bg-card/95 px-4 pb-4 pt-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Join Friends List</p>
            <p className="text-lg font-bold">
              {host.id === "demo-jen" ? (
                <span className="text-gradient-brand">Free</span>
              ) : (
                <>
                  ${host.priceMonthly}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onTip} aria-label="Send tip" className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-background hover:bg-primary/10">
              <Gift className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate({ to: "/chat/$hostId", params: { hostId: host.id } })}
              aria-label="Message"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-background hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
        {host.id === "demo-jen" ? (
          <button
            onClick={() => navigate({ to: "/chat/$hostId", params: { hostId: host.id } })}
            className="btn-brand flex w-full items-center justify-center gap-2"
          >
            <img src={rizzAiLogo.url} alt="" className="h-5 w-5 rounded-full" />
            Chat Jen — Free
          </button>
        ) : (
          <button onClick={onSubscribe} className="btn-brand flex w-full items-center justify-center gap-2">
            <img src={rizzAiLogo.url} alt="" className="h-5 w-5 rounded-full" />
            Unlock {host.name}&apos;s Friends List
          </button>
        )}
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {host.id === "demo-jen"
            ? "Jen is our founding host — free to chat while we test."
            : "Cancel anytime · Chat access continues for 30 minutes after cancel."}
        </p>
      </div>


      {tipOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setTipOpen(false)}>
          <div className="w-full max-w-[480px] rounded-t-3xl border-t border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Send a tip to</p>
            <h3 className="mt-1 text-lg font-bold">{host.name}</h3>
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
