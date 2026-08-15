import { DemoChatProofs } from "@/components/DemoChatProofs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Heart,
  Users,
  ShieldCheck,
  Gift,
  Crown,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import crushLogo from "@/assets/crush-logo.png.asset.json";
import { hostAvatarMed } from "@/lib/host-avatars";
import { pageHead, faqLd, jsonLd, SITE_URL } from "@/lib/seo";

const FAQS = [
  {
    q: "What is Crush?",
    a: "Meet your favorite exclusive creators on CRUSH. Members get 24/7 access to chat, connect, and enjoy one-on-one time with the creators they love.",
  },
  {
    q: "How much does Crush cost?",
    a: "Joining is free. Crush Gold is $9.99 per week and unlocks any creator's Friends List. Crush Diamond VIP is $19.99 per week and adds a diamond badge plus weekly coin drops.",
  },
  {
    q: "Are the creators real and verified?",
    a: "Yes. Every creator passes 18+ identity verification before they can earn, and all uploads are moderated before they appear publicly.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Memberships are weekly and can be cancelled at any time from your subscriptions page; access runs to the end of the paid week.",
  },
  {
    q: "Is Crush on iPhone and Android?",
    a: "Crush works in any mobile browser and installs to your home screen as an app, with native iOS and Android builds rolling out.",
  },
];

export const Route = createFileRoute("/crush-home")({
  head: () => {
    const base = pageHead({
      path: "/crush-home",
      title: "Crush Home — Chat with your verified favourite creators",
      description:
        "Meet your favorite exclusive creators on CRUSH. Members get 24/7 access to chat, connect, and enjoy one-on-one time with the creators they love.",
      keywords:
        "crush app, exclusive creators, meet creators, chat with creators, one on one chat, 24/7 access, crush gold, crush diamond vip",
    });
    return {
      ...base,
      scripts: [
        faqLd(FAQS),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Crush",
          applicationCategory: "SocialNetworkingApplication",
          operatingSystem: "iOS, Android, Web",
          url: `${SITE_URL}/crush-home`,
          offers: [
            {
              "@type": "Offer",
              name: "Crush Gold",
              price: "9.99",
              priceCurrency: "USD",
            },
            {
              "@type": "Offer",
              name: "Crush Diamond VIP",
              price: "19.99",
              priceCurrency: "USD",
            },
          ],
        }),
      ],
    };
  },
  component: CrushHome,
});

const NAV = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "Creators", href: "#creators" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Confidence", href: "/confidence" },
  { label: "Why Crush", href: "/why-crush" },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Real DMs with real creators",
    body: "Unlock a creator's Friends List and message her directly — no bots, no queue, no algorithm deciding who she replies to.",
  },
  {
    icon: Users,
    title: "Live rooms every night",
    body: "Drop into city and vibe rooms where creators host the conversation. Lurk, chime in, or take it to a DM.",
  },
  {
    icon: Gift,
    title: "Gifts that actually land",
    body: "Send coins as gifts and tips mid-conversation. She sees it instantly, and it goes straight to her earnings.",
  },
  {
    icon: Heart,
    title: "Stories & private galleries",
    body: "Photos, videos and 24-hour stories with captions — visible to the people on her Friends List.",
  },
  {
    icon: ShieldCheck,
    title: "18+ verified, moderated",
    body: "Every creator passes identity and age verification, and every upload is screened before it goes public.",
  },
  {
    icon: Crown,
    title: "Gold & Diamond perks",
    body: "Gold opens every Friends List. Diamond VIP adds a prism badge, priority visibility and weekly coin drops.",
  },
];

type DemoChat = {
  id: string;
  name: string;
  handle: string;
  tint: string;
  messages: Array<{ from: "her" | "you"; text: string }>;
};

const DEMO_CHATS: DemoChat[] = [
  {
    id: "demo-jen",
    name: "Jen",
    handle: "@jenrizz",
    tint: "linear-gradient(160deg,#e0243f,#7d0a1e)",
    messages: [
      { from: "her", text: "you actually showed up 😌 how was your day?" },
      { from: "you", text: "long. better now though." },
      { from: "her", text: "good answer. tell me the worst part, I'll fix your mood." },
      { from: "you", text: "sent a gift 🎁 500 coins" },
      { from: "her", text: "okay now I'm the one blushing 🥹 give me 2 mins, posting you a story." },
    ],
  },
  {
    id: "demo-aria",
    name: "Wonder Woman",
    handle: "@wonderwoman",
    tint: "linear-gradient(160deg,#e9b872,#a8590f)",
    messages: [
      { from: "her", text: "golden hour just hit, new photos in the gallery 🌅" },
      { from: "you", text: "unlocked. that third one is unreal." },
      { from: "her", text: "that's my favourite too. what were you doing while I was shooting?" },
      { from: "you", text: "gym then thinking about what to say here 😅" },
      { from: "her", text: "honesty gets you extra replies. keep going." },
    ],
  },
  {
    id: "demo-nova",
    name: "Nova",
    handle: "@novastar",
    tint: "linear-gradient(160deg,#b3122b,#2a0410)",
    messages: [
      { from: "her", text: "room's open in 10 — we're doing bad takes only 🎮" },
      { from: "you", text: "I have several bad takes ready" },
      { from: "her", text: "perfect. bring one about pineapple pizza, I'm building a case." },
      { from: "you", text: "joined the room ✅" },
      { from: "her", text: "there he is 👀 mic's yours." },
    ],
  },
];

function PhoneChat({ chat, delay }: { chat: DemoChat; delay: number }) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const t = window.setInterval(() => {
      setShown((n) => (n >= chat.messages.length ? 1 : n + 1));
    }, 1900);
    return () => window.clearInterval(t);
  }, [chat.messages.length]);

  return (
    <div
      className="rounded-[2rem] p-4 sm:p-5 crush-home-panel"
      style={{ animation: `fadeUp .7s ${delay}ms both` }}
    >
      <p className="mb-4 text-center text-sm font-bold tracking-tight">
        Chatting with{" "}
        <span className="crush-home-gold-text">{chat.name}</span>
      </p>
      <div
        className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border-[6px] shadow-2xl"
        style={{ borderColor: "#0b0104", background: chat.tint }}
      >
        {/* status bar */}
        <div className="flex items-center justify-between px-4 pt-2 text-[10px] font-bold text-white/80">
          <span>9:41</span>
          <span>Crush</span>
        </div>
        {/* header */}
        <div className="flex items-center gap-2 px-3 py-3">
          <img
            src={hostAvatarMed(chat.id)}
            alt={`${chat.name}, verified Crush creator`}
            loading="lazy"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/50"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{chat.name}</p>
            <p className="truncate text-[10px] text-white/70">{chat.handle} · online</p>
          </div>
          <ShieldCheck className="ml-auto h-4 w-4 text-white/80" />
        </div>
        {/* messages */}
        <div className="flex min-h-[300px] flex-col justify-end gap-2 bg-black/25 px-3 py-3">
          {chat.messages.slice(0, shown).map((m, i) => (
            <div
              key={i}
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-[11px] leading-snug ${
                m.from === "her"
                  ? "self-start bg-white/92 text-[#1b0409]"
                  : "self-end bg-black/55 text-white"
              }`}
              style={{ animation: "fadeUp .35s both" }}
            >
              {m.text}
            </div>
          ))}
          <div className="mt-2 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2">
            <span className="text-[11px] text-white/55">Message {chat.name}…</span>
            <Heart className="ml-auto h-3.5 w-3.5 text-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    blurb: "Look around, join rooms, and try AI creator chats.",
    perks: [
      "Browse every verified creator",
      "Join public rooms",
      "3 free messages with AI creators",
      "Stories and public galleries",
    ],
    cta: "Create account",
    to: "/auth",
    featured: false,
  },
  {
    name: "Crush Gold",
    price: "$9.99",
    per: "per week",
    blurb: "Unlock any creator's Friends List and DM her directly.",
    perks: [
      "Unlock any Friends List",
      "Unlimited direct messages",
      "Private photos, videos & captions",
      "Gift and tip with coins",
      "Gold badge in every room",
    ],
    cta: "Get Crush Gold",
    to: "/upgrade",
    featured: true,
  },
  {
    name: "Crush Diamond VIP",
    price: "$19.99",
    per: "per week",
    blurb: "Everything in Gold, plus the treatment that gets you noticed.",
    perks: [
      "Everything in Crush Gold",
      "Diamond prism badge",
      "Weekly coin drops",
      "Priority in creator inboxes",
      "Front-row placement in rooms",
    ],
    cta: "Go Diamond VIP",
    to: "/upgrade",
    featured: false,
  },
];

const COIN_PACKS = [
  { coins: "500", price: "$4.99" },
  { coins: "1,500", price: "$9.99" },
  { coins: "5,000", price: "$24.99" },
  { coins: "15,000", price: "$49.99" },
];

function CrushHome() {
  return (
    <div className="crush-home min-h-screen" id="top">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-[var(--ch-line)] bg-[rgba(20,2,10,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/crush-home" className="flex items-center gap-2.5">
            <img
              src={crushLogo.url}
              alt="Crush logo"
              className="h-9 w-9 rounded-xl object-cover"
            />
            <span className="text-lg font-black tracking-tight">
              Crush
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="text-sm font-semibold text-[var(--ch-ink-dim)] transition-colors hover:text-[var(--ch-gold)]"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <Link
            to="/auth"
            className="ml-auto rounded-full px-5 py-2.5 text-sm font-black text-[#1b0409] shadow-lg transition-transform hover:scale-[1.03] md:ml-0"
            style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ch-line)] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ch-gold)]">
            <Sparkles className="h-3.5 w-3.5" /> 18+ verified creator chat
          </span>
          <h1 className="mt-6 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Real chats with your{" "}
            <span className="crush-home-gold-text">verified favourite creators</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--ch-ink-dim)] sm:text-lg">
            Crush is where creators run private Friends Lists — you unlock hers, she
            actually replies. Direct messages, live rooms, gifts, stories and
            galleries, all in one app.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="rounded-full px-7 py-3.5 text-sm font-black text-[#1b0409] shadow-xl transition-transform hover:scale-[1.03]"
              style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
            >
              Get Started free
            </Link>
            <Link
              to="/upgrade"
              className="rounded-full border border-[var(--ch-line)] px-7 py-3.5 text-sm font-black text-[var(--ch-ink)] transition-colors hover:border-[var(--ch-gold)]"
            >
              View pricing
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {["Verified creators", "Live rooms nightly", "Gifts & coins", "Moderated 18+"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full crush-home-panel px-4 py-2 text-xs font-bold text-[var(--ch-ink-dim)]"
                >
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
            Everything Crush does
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--ch-ink-dim)]">
            One app for the conversations, the rooms and the moments you can't get
            anywhere else.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl crush-home-panel p-6">
                <f.icon className="h-7 w-7 text-[var(--ch-gold)]" />
                <h3 className="mt-4 text-lg font-black tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ch-ink-dim)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CHATS */}
      <section id="creators" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
            See Crush in action
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--ch-ink-dim)]">
            Real conversations, gifts and rooms — this is what a night on Crush
            looks like.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {DEMO_CHATS.map((c, i) => (
              <PhoneChat key={c.id} chat={c} delay={i * 120} />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[var(--ch-ink-dim)]">
            Demo conversations shown with Crush creator profiles. 18+ only.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-black tracking-tight sm:text-4xl">
            Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--ch-ink-dim)]">
            Weekly memberships, cancel any time. Coins for gifts are bought
            separately.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  p.featured ? "" : "crush-home-panel"
                }`}
                style={
                  p.featured
                    ? {
                        border: "1px solid rgba(233,184,114,0.55)",
                        background:
                          "linear-gradient(160deg, rgba(233,184,114,0.16), rgba(179,18,43,0.30))",
                        boxShadow: "0 30px 90px -30px rgba(233,184,114,0.45)",
                      }
                    : undefined
                }
              >
                {p.featured ? (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#1b0409]"
                    style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872)" }}
                  >
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-xl font-black tracking-tight">{p.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="crush-home-gold-text text-4xl font-black tracking-tight">
                    {p.price}
                  </span>
                  <span className="pb-1 text-sm text-[var(--ch-ink-dim)]">{p.per}</span>
                </div>
                <p className="mt-3 text-sm text-[var(--ch-ink-dim)]">{p.blurb}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ch-gold)]" />
                      <span className="text-[var(--ch-ink-dim)]">{perk}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.to}
                  className={`mt-7 rounded-full px-5 py-3 text-center text-sm font-black transition-transform hover:scale-[1.02] ${
                    p.featured ? "text-[#1b0409]" : "text-[var(--ch-ink)]"
                  }`}
                  style={
                    p.featured
                      ? { background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }
                      : { border: "1px solid var(--ch-line)" }
                  }
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl crush-home-panel p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Gift className="h-5 w-5 text-[var(--ch-gold)]" />
              <p className="text-sm font-bold">Coin packs for gifts and tips</p>
              <Link
                to="/coins"
                className="ml-auto inline-flex items-center gap-1 text-sm font-black text-[var(--ch-gold)]"
              >
                Buy coins <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {COIN_PACKS.map((c) => (
                <div
                  key={c.coins}
                  className="rounded-2xl border border-[var(--ch-line)] px-4 py-3 text-center"
                >
                  <p className="text-sm font-black">{c.coins} coins</p>
                  <p className="text-xs text-[var(--ch-ink-dim)]">{c.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 py-16 sm:py-20">
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

      {/* CTA */}
      <section className="px-4 pb-16">
        <div
          className="mx-auto max-w-4xl rounded-[2.5rem] p-10 text-center"
          style={{
            border: "1px solid rgba(233,184,114,0.4)",
            background:
              "linear-gradient(160deg, rgba(179,18,43,0.55), rgba(20,2,10,0.6))",
          }}
        >
          <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            She's online right now
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--ch-ink-dim)]">
            Create your free account, find your creator, and start the
            conversation tonight.
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-block rounded-full px-8 py-3.5 text-sm font-black text-[#1b0409] shadow-xl transition-transform hover:scale-[1.03]"
            style={{ background: "linear-gradient(120deg,#f7d9a0,#e9b872 55%,#c9924b)" }}
          >
            Join Crush free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-4">
        <DemoChatProofs limit={12} />
      </section>

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
              <Link to="/confidence">Boost your confidence</Link>
              <Link to="/why-crush">Why Crush works</Link>
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
  );
}
