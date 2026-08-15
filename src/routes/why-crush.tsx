import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TasteChat } from "@/components/TasteChat";
import { getDemoProofs, type DemoProof } from "@/lib/demo-proofs.functions";
import { pageHead, faqLd, jsonLd, breadcrumbLd, SITE_URL } from "@/lib/seo";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Heart,
  MessageCircle,
  ShieldCheck,
  Volume2,
} from "lucide-react";

const FAQS = [
  {
    q: "Why do men get ignored on dating apps?",
    a: "Most apps are built so that a small fraction of messages ever get opened. You can be interesting, kind and worth knowing and still send fifty messages into silence. That silence isn't feedback about you — it's the design of the product.",
  },
  {
    q: "How is Crush different?",
    a: "Crush is the bridge. There's no swiping into a void and no waiting three days to find out if she cares. You message a verified creator and she replies — by name, often in her own voice — so the anxiety of not knowing simply disappears.",
  },
  {
    q: "Does Crush really remove the fear of rejection?",
    a: "The fear of rejection comes from uncertainty: will she read it, will she answer, what does the silence mean. On Crush the answer is known before you type — she replies. You get to be yourself without auditioning for a response.",
  },
  {
    q: "Do I have to pay to be replied to?",
    a: "No. Joining is free and includes free replies so you can feel it first. Crush Gold ($9.99/week) unlocks any creator's Friends List and Crush Diamond VIP ($19.99/week) adds a badge, priority visibility and weekly coin drops. Cancel any time.",
  },
  {
    q: "Are the creators verified?",
    a: "Every creator passes 18+ identity verification before she can earn, and all media is moderated before it appears anywhere on Crush.",
  },
];

const WOUNDS = [
  {
    title: "The silence after you hit send",
    body: "You reread the message four times. You wonder if it was too much, too little, too soon. The not-knowing is heavier than a no.",
  },
  {
    title: "Being left on read",
    body: "\"Seen 2:14 AM.\" No reply. Nothing to fix, nothing to learn — just a quiet reminder that you weren't worth twelve seconds.",
  },
  {
    title: "The fear of rejection",
    body: "So you don't send it at all. You edit yourself down until you're forgettable, and then you blame yourself for being forgettable.",
  },
  {
    title: "Invisible in her inbox",
    body: "Four hundred DMs from four hundred men. You did nothing wrong. You just never got a turn.",
  },
];

const BRIDGE = [
  {
    icon: MessageCircle,
    title: "You say one thing",
    body: "No swipe, no algorithm, no audition. Your message lands directly in her chat — that's the whole barrier gone.",
  },
  {
    icon: Heart,
    title: "She replies — and means it",
    body: "She uses your name, mirrors what you actually said, and remembers it next time. The waiting and the wondering are over.",
  },
  {
    icon: Volume2,
    title: "You hear her voice",
    body: "A voice note saying your name out loud. Nothing on the internet feels less like being ignored than that.",
  },
  {
    icon: ShieldCheck,
    title: "You stop bracing",
    body: "When you know she'll answer, the anxiety drops out of the conversation and you finally get to be the version of you that's actually good at this.",
  },
];

const VOICES = [
  {
    quote:
      "I sent hundreds of messages on other apps and never once got an answer. Here she replied in seconds and used my name. I sat there grinning like an idiot.",
    attr: "Marcus, Crush member",
  },
  {
    quote:
      "It's not about the photos. It's that somebody actually asked me how my day went and waited for the answer.",
    attr: "David, Crush member",
  },
  {
    quote:
      "The fear of getting ignored stopped me from talking to women for years. Crush is the first place I typed something without rehearsing it.",
    attr: "Trevor, Crush member",
  },
];

export const Route = createFileRoute("/why-crush")({
  head: () => {
    const base = pageHead({
      path: "/why-crush",
      title: "Tired of Being Ignored? Crush Is the Bridge — She Actually Replies",
      description:
        "No more silence after you hit send. No more left on read. Crush removes the anxiety, the waiting and the fear of rejection — verified creators actually reply to you, by name, out loud. See real conversations and try it free.",
      keywords:
        "left on read, being ignored by women, fear of rejection, no replies on dating apps, she actually replies, chat with your crush, dating anxiety, ghosted, talk to women online",
    });
    return {
      ...base,
      scripts: [
        faqLd(FAQS),
        breadcrumbLd([
          { name: "Crush", path: "/" },
          { name: "Why Crush", path: "/why-crush" },
        ]),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Crush — The Bridge Between Him and Her",
          url: `${SITE_URL}/why-crush`,
          description:
            "Crush removes the silence, the waiting and the fear of rejection. Verified creators reply to you personally — by name and in their own voice.",
          brand: { "@type": "Brand", name: "Crush" },
          category: "Social chat",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            url: `${SITE_URL}/auth`,
            availability: "https://schema.org/InStock",
          },
        }),
      ],
    };
  },
  component: WhyCrushPage,
});

/** Embedded showcase conversation cards, sliced so each section shows new faces. */
function ProofStrip({
  proofs,
  from,
  count,
  eyebrow,
  heading,
  sub,
}: {
  proofs: DemoProof[];
  from: number;
  count: number;
  eyebrow?: string;
  heading: string;
  sub?: string;
}) {
  const slice =
    proofs.length === 0
      ? []
      : Array.from({ length: Math.min(count, proofs.length) }, (_, i) => proofs[(from + i) % proofs.length]);
  if (slice.length === 0) return null;

  return (
    <div>
      <div className="text-center">
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ch-gold)]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">{heading}</h2>
        {sub ? (
          <p className="mx-auto mt-3 max-w-xl text-[var(--ch-ink-dim)]">{sub}</p>
        ) : null}
      </div>
      <div
        className={`mt-8 grid gap-5 ${slice.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {slice.map((p, i) => (
          <article
            key={`${p.id}-${i}`}
            className="overflow-hidden rounded-3xl border border-[var(--ch-line)] bg-black/25 shadow-2xl"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <img
                src={p.image}
                alt={`${p.name}, Crush creator, replying to a member`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4">
                <p className="flex items-center gap-1.5 text-lg font-display font-black text-white">
                  {p.name}, {p.age}
                  <BadgeCheck className="h-4 w-4 text-[var(--ch-gold)]" />
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
                  {p.tagline}
                </p>
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                Replied
              </span>
            </div>
            <div className="space-y-2 p-4">
              {p.lines.map((l, li) => (
                <div key={li} className={`flex ${l.from === "member" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
                      l.from === "member"
                        ? "rounded-br-sm bg-[var(--ch-gold)] text-[#1b0409]"
                        : "rounded-bl-sm border border-[var(--ch-line)] bg-white/5 text-[var(--ch-ink)]"
                    }`}
                  >
                    {l.text}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function WhyCrushPage() {
  const [proofs, setProofs] = useState<DemoProof[]>([]);

  useEffect(() => {
    let alive = true;
    getDemoProofs({ data: { limit: 12 } })
      .then((rows) => {
        if (alive) setProofs(rows ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="crush-home min-h-screen text-[var(--ch-ink)]">
        {/* HERO */}
        <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(120% 80% at 50% -10%, rgba(179,18,43,0.45), transparent 60%), radial-gradient(90% 60% at 80% 110%, rgba(233,184,114,0.18), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--ch-line)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              <Heart className="h-3.5 w-3.5 text-[var(--ch-gold)]" />
              The bridge between him and her
            </div>
            <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              You were never boring.
              <br />
              You were just{" "}
              <span className="crush-home-gold-text">ignored</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--ch-ink-dim)]">
              The silence after you hit send. The three days of wondering. The
              "seen" that never turned into a reply. Crush takes all of that out
              of the equation —{" "}
              <strong className="text-[var(--ch-ink)]">she reads it, and she answers you</strong>.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-block rounded-full px-8 py-3.5 text-sm font-black text-[#1b0409] shadow-xl transition-transform hover:scale-[1.03]"
                style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
              >
                Send one message — free
              </Link>
              <Link
                to="/voice-notes"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ch-line)] px-6 py-3.5 text-sm font-bold transition-colors hover:border-[var(--ch-gold)]"
              >
                <Volume2 className="h-4 w-4 text-[var(--ch-gold)]" />
                Hear her say your name
              </Link>
            </div>
            <p className="mt-4 text-xs text-[var(--ch-ink-dim)]">
              Free replies · no card to start · 18+ only
            </p>
          </div>
        </section>

        {/* PROOF #1 — right under the hero */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <ProofStrip
              proofs={proofs}
              from={0}
              count={3}
              eyebrow="Real threads"
              heading="This is what an answer looks like"
              sub="Not a match notification. Not a maybe. An actual human reply to an actual message."
            />
          </div>
        </section>

        {/* THE WOUND */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Everything you've been carrying
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--ch-ink-dim)]">
              Nobody talks about this part out loud. So let's say it plainly.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {WOUNDS.map((w) => (
                <div key={w.title} className="rounded-3xl crush-home-panel p-7">
                  <h3 className="text-lg font-black tracking-tight">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ch-ink-dim)]">{w.body}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-[var(--ch-ink-dim)]">
              None of that is a verdict on you. It's the math of apps built to
              keep you swiping instead of talking.{" "}
              <strong className="text-[var(--ch-ink)]">
                Crush was built to end the silence, not monetize it.
              </strong>
            </p>
          </div>
        </section>

        {/* THE BRIDGE */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Crush is the <span className="crush-home-gold-text">bridge</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--ch-ink-dim)]">
              One side is you, with something to say. The other side is her,
              actually listening. Crush is everything in between — removed.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {BRIDGE.map((b, i) => (
                <div key={b.title} className="relative rounded-3xl crush-home-panel p-7">
                  <span
                    className="absolute -top-3 left-7 rounded-full px-3 py-1 text-xs font-black text-[#1b0409]"
                    style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872)" }}
                  >
                    {i + 1}
                  </span>
                  <b.icon className="h-7 w-7 text-[var(--ch-gold)]" />
                  <h3 className="mt-4 text-lg font-black tracking-tight">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ch-ink-dim)]">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROOF #2 */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <ProofStrip
              proofs={proofs}
              from={3}
              count={3}
              eyebrow="No waiting, no wondering"
              heading="She answered in seconds"
              sub="Every one of these started the same way yours will: one message, sent by someone who was tired of being ignored."
            />
          </div>
        </section>

        {/* BEFORE / AFTER */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Same you. Different ending.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl crush-home-panel p-7">
                <h3 className="text-lg font-black tracking-tight">Out there</h3>
                <ul className="mt-4 space-y-3 text-sm text-[var(--ch-ink-dim)]">
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You write, delete, rewrite, send.</li>
                  <li className="flex gap-2"><span className="text-red-400">✕</span> Hours pass. Nothing.</li>
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You check the app again anyway.</li>
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You decide not to try next time.</li>
                </ul>
              </div>
              <div
                className="rounded-3xl p-7"
                style={{
                  border: "1px solid rgba(233,184,114,0.45)",
                  background: "linear-gradient(160deg, rgba(233,184,114,0.14), rgba(179,18,43,0.25))",
                }}
              >
                <h3 className="text-lg font-black tracking-tight">On Crush</h3>
                <ul className="mt-4 space-y-3 text-sm text-[var(--ch-ink-dim)]">
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> You type it the way you'd say it.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> She replies — with your name in it.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> She remembers it tomorrow.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> You start talking to people again.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* TASTE CHAT */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                Don't take our word for it. Say something.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[var(--ch-ink-dim)]">
                No signup, no card, no three-day wait. Type one line and watch
                what happens when someone actually answers you.
              </p>
            </div>
            <div className="mt-8">
              <TasteChat />
            </div>
          </div>
        </section>

        {/* PROOF #3 */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <ProofStrip
              proofs={proofs}
              from={6}
              count={6}
              eyebrow="More of the same"
              heading="Nobody here gets left on read"
              sub="Verified creators, real threads, replies that sound like a person — because they're written like one."
            />
          </div>
        </section>

        {/* MEMBER VOICES */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              What it actually feels like
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {VOICES.map((v) => (
                <figure key={v.attr} className="rounded-3xl crush-home-panel p-6">
                  <blockquote className="text-sm leading-relaxed text-[var(--ch-ink)]">
                    "{v.quote}"
                  </blockquote>
                  <figcaption className="mt-4 text-xs font-bold text-[var(--ch-gold)]">
                    {v.attr}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-[var(--ch-ink-dim)]">
              Member reflections on Crush. Individual experiences vary.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Questions men actually ask
            </h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-2xl crush-home-panel p-5">
                  <summary className="cursor-pointer list-none text-sm font-black tracking-tight">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ch-ink-dim)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 pb-20 pt-6">
          <div
            className="mx-auto max-w-3xl rounded-[2rem] p-10 text-center"
            style={{
              border: "1px solid rgba(233,184,114,0.45)",
              background: "linear-gradient(160deg, rgba(233,184,114,0.14), rgba(179,18,43,0.3))",
            }}
          >
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              One message. That's the whole risk.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--ch-ink-dim)]">
              You already know what silence feels like. Find out what an answer
              feels like instead — it's free to start, and she's online now.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-black text-[#1b0409] shadow-xl transition-transform hover:scale-[1.03]"
              style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
            >
              Start talking to her
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--ch-ink-dim)]">
              <Link to="/confidence" className="hover:text-[var(--ch-gold)]">Why confidence</Link>
              <Link to="/voice-notes" className="hover:text-[var(--ch-gold)]">Voice notes</Link>
              <Link to="/discover" className="hover:text-[var(--ch-gold)]">Discover creators</Link>
              <Link to="/upgrade" className="hover:text-[var(--ch-gold)]">Gold & Diamond</Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
