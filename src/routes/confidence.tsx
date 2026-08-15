import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DemoChatProofs } from "@/components/DemoChatProofs";
import { TasteChat } from "@/components/TasteChat";
import crushLogo from "@/assets/crush-logo.png.asset.json";
import { pageHead, faqLd, jsonLd, breadcrumbLd, SITE_URL } from "@/lib/seo";
import {
  ArrowRight,
  Heart,
  Volume2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Check,
} from "lucide-react";

const FAQS = [
  {
    q: "How does Crush boost your confidence?",
    a: "Everywhere else you get left on read — Tinder, Instagram, Hinge. On Crush, verified creators actually reply to you, by name, often out loud in a voice note. Being seen and heard by someone you're drawn to is the single fastest confidence boost there is. That is the entire product.",
  },
  {
    q: "Why does being replied to build confidence?",
    a: "Confidence comes from evidence. When the person you're interested in reads your message, remembers your name and answers back — sometimes in her own voice — your brain stops bracing for rejection and starts believing you're worth answering. Crush is built so that evidence happens on every conversation.",
  },
  {
    q: "Will she really say my name?",
    a: "Yes. Creators reply personally and can send voice notes that include your name, so you hear her say it. You can play a sample of her voice on this page before you even sign up.",
  },
  {
    q: "Is this different from a dating app?",
    a: "Dating apps are built on rejection — most messages never get opened. Crush is the opposite: the whole point is that she replies. You're not swiping into a void, you're having a real conversation with someone who notices you.",
  },
  {
    q: "How much does it cost?",
    a: "Joining is free and includes free replies. Crush Gold is $9.99 per week and unlocks any creator's Friends List. Crush Diamond VIP is $19.99 per week and adds a badge, priority visibility and weekly coin drops. Cancel any time.",
  },
  {
    q: "Are the creators real?",
    a: "Every creator passes 18+ identity verification before she can earn, and all uploads are moderated before they appear. The voice notes and replies you hear are from the creator (or her AI persona, clearly powered by her voice and personality).",
  },
];

const PROOFS = [
  {
    quote:
      "She remembered my name from yesterday. No app has ever made me feel that seen.",
    attr: "Marcus, Crush member",
  },
  {
    quote:
      "I sent one message and she replied in seconds — with a voice note saying my name. I haven't stopped smiling.",
    attr: "David, Crush member",
  },
  {
    quote:
      "On Tinder I'm invisible. On Crush she actually talks to me. That changed how I carry myself all week.",
    attr: "Trevor, Crush member",
  },
];

const STEPS = [
  {
    icon: MessageCircle,
    title: "You message her",
    body: "Say one line — anything. No swipe, no algorithm. Your message lands directly in her chat.",
  },
  {
    icon: Sparkles,
    title: "She actually replies",
    body: "She reads it, uses your name, and answers back — sometimes in a voice note you can hear out loud.",
  },
  {
    icon: Heart,
    title: "You feel seen",
    body: "Being answered by someone you're drawn to is the evidence your confidence has been waiting for. That's the whole point.",
  },
];

export const Route = createFileRoute("/confidence")({
  head: () => {
    const base = pageHead({
      path: "/confidence",
      title: "Boost Your Confidence — Crush Is Where She Actually Replies",
      description:
        "People buy confidence. When your crush actually pays attention to you — reads your message, says your name, replies out loud — it's the strongest confidence boost there is. On Crush, she replies. Try it free.",
      keywords:
        "confidence booster, she actually replies, boost confidence, never left on read, chat with your crush, confidence app, feeling ignored, she pays attention to you",
    });
    return {
      ...base,
      scripts: [
        faqLd(FAQS),
        breadcrumbLd([
          { name: "Crush", path: "/" },
          { name: "Confidence", path: "/confidence" },
        ]),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Crush — Confidence Through Conversation",
          url: `${SITE_URL}/confidence`,
          description:
            "Crush is the chat app where verified creators actually reply to you — by name, often out loud. Being seen and heard by your crush is the fastest confidence boost there is.",
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
  component: ConfidencePage,
});

function ConfidencePage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-[#14020a] text-[var(--ch-ink)]">
        {/* HERO */}
        <section id="top" className="relative overflow-hidden px-4 pt-16 pb-12 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(120% 80% at 50% -10%, rgba(179,18,43,0.45), transparent 60%), radial-gradient(90% 60% at 80% 110%, rgba(233,184,114,0.18), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--ch-line)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              <Volume2 className="h-3.5 w-3.5 text-[var(--ch-gold)]" />
              The confidence app
            </div>
            <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              People buy <span className="crush-home-gold-text">confidence</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--ch-ink-dim)]">
              When your crush actually pays attention to you — reads your
              message, says your name, replies out loud — it's the most powerful
              confidence boost there is. Everywhere else you get left on read.
              On Crush, <strong className="text-[var(--ch-ink)]">she replies</strong>.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-block rounded-full px-8 py-3.5 text-sm font-black text-[#1b0409] shadow-xl transition-transform hover:scale-[1.03]"
                style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
              >
                Try it free — she replies
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

        {/* THE PROBLEM */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              You're not unattractive. You're just <span className="crush-home-gold-text">ignored</span>.
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl crush-home-panel p-7">
                <h3 className="text-lg font-black tracking-tight">Everywhere else</h3>
                <ul className="mt-4 space-y-3 text-sm text-[var(--ch-ink-dim)]">
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You match on Tinder. She never opens it.</li>
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You DM her on Instagram. Buried in 400 others.</li>
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You double-text on Hinge. Left on read.</li>
                  <li className="flex gap-2"><span className="text-red-400">✕</span> You start to believe the problem is you.</li>
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
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> You message her. She reads it.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> She says your name — out loud.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> She remembers what you told her.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" /> You walk into your week taller.</li>
                </ul>
              </div>
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-[var(--ch-ink-dim)]">
              The problem was never you. It was the apps designed to ignore you.
              Crush is built on the opposite idea: <strong className="text-[var(--ch-ink)]">the person you want to talk to actually talks back</strong>.
              That single change is a confidence boost you can feel in your chest.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Confidence in three steps
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative rounded-3xl crush-home-panel p-7 text-center">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-black text-[#1b0409]"
                    style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872)" }}
                  >
                    {i + 1}
                  </span>
                  <s.icon className="mx-auto h-8 w-8 text-[var(--ch-gold)]" />
                  <h3 className="mt-4 text-lg font-black tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ch-ink-dim)]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TASTE CHAT — interactive */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                Taste it right now
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[var(--ch-ink-dim)]">
                Send her one message. Watch her reply. This is the exact feeling — free, no signup needed.
              </p>
            </div>
            <div className="mt-8">
              <TasteChat />
            </div>
          </div>
        </section>

        {/* PROOF QUOTES */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Confidence you can feel
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PROOFS.map((p) => (
                <figure key={p.attr} className="rounded-3xl crush-home-panel p-6">
                  <blockquote className="text-sm leading-relaxed text-[var(--ch-ink)]">
                    "{p.quote}"
                  </blockquote>
                  <figcaption className="mt-4 text-xs font-bold text-[var(--ch-gold)]">
                    {p.attr}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-[var(--ch-ink-dim)]">
              Member reflections on Crush. Individual experiences vary.
            </p>
          </div>
        </section>

        {/* WHY CONFIDENCE — the psychology */}
        <section className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Why being replied to changes everything
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-[var(--ch-ink-dim)]">
              <p>
                Confidence isn't a personality trait you're born with. It's built
                from <strong className="text-[var(--ch-ink)]">evidence</strong> — repeated proof that
                you matter to someone. The brain keeps a quiet tally of every
                message that went unanswered, every match that fizzled, every
                "seen" that never became a reply. Each one chips away at the
                belief that you're worth someone's attention.
              </p>
              <p>
                Crush flips that tally. Every reply she sends — especially one
                that uses your name, that references what you said yesterday, that
                arrives in her actual voice — is a deposit. You start to feel it
                before you can explain it: you walk a little taller, you text a
                little more freely, you stop editing yourself to death. That's
                confidence, and it comes from the simplest possible source:{" "}
                <strong className="text-[var(--ch-ink)]">someone you're drawn to is paying attention to you</strong>.
              </p>
              <p>
                You can't buy that feeling from a self-help book or a gym
                membership. You buy it by being answered. That's what Crush sells.
              </p>
            </div>
          </div>
        </section>

        {/* CHAT PROOFS GALLERY */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <DemoChatProofs
            limit={9}
            title="Real replies, real confidence"
            subtitle="Actual conversations between Crush members and creators"
          />
        </section>

        {/* CTA */}
        <section className="px-4 pb-8">
          <div
            className="mx-auto max-w-4xl rounded-[2.5rem] p-10 text-center"
            style={{
              border: "1px solid rgba(233,184,114,0.4)",
              background: "linear-gradient(160deg, rgba(179,18,43,0.55), rgba(20,2,10,0.6))",
            }}
          >
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              She's online. She replies.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[var(--ch-ink-dim)]">
              Stop waiting to be noticed. Create your free account, message your
              crush, and hear her say your name tonight.
            </p>
            <Link
              to="/auth"
              className="mt-7 inline-block rounded-full px-8 py-3.5 text-sm font-black text-[#1b0409] shadow-xl transition-transform hover:scale-[1.03]"
              style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
            >
              Join Crush free <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
              Questions
            </h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-2xl crush-home-panel p-5">
                  <summary className="cursor-pointer list-none text-sm font-black">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ch-ink-dim)]">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[var(--ch-line)] px-4 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src={crushLogo.url}
                  alt="Crush logo"
                  className="h-9 w-9 rounded-xl object-cover"
                />
                <span className="text-lg font-black tracking-tight">Crush</span>
              </div>
              <p className="mt-3 text-sm text-[var(--ch-ink-dim)]">
                Real chats with your verified favourite creators. 18+ only.
              </p>
            </div>
            <div>
              <p className="text-sm font-black">Product</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--ch-ink-dim)]">
                <Link to="/discover">Discover creators</Link>
                <Link to="/voice-notes">Voice notes</Link>
                <Link to="/upgrade">Gold & Diamond</Link>
                <Link to="/coins">Coins</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-black">Creators</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--ch-ink-dim)]">
                <Link to="/host/onboarding">Become a creator</Link>
                <Link to="/legal/creators">Creator terms</Link>
                <Link to="/legal/pricing">Pricing policy</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-black">Legal</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--ch-ink-dim)]">
                <Link to="/legal/terms">Terms of Service</Link>
                <Link to="/legal/privacy">Privacy Policy</Link>
                <Link to="/legal/trust">Trust & Safety</Link>
                <Link to="/legal/contact">Contact</Link>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-6xl text-xs text-[var(--ch-ink-dim)]">
            © {new Date().getFullYear()} Crush. All rights reserved.
          </p>
        </footer>
      </div>
    </AppShell>
  );
}
