import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DemoChatProofs } from "@/components/DemoChatProofs";
import { Waveform } from "@/components/chat/VoiceNote";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { hostAvatarMed } from "@/lib/host-avatars";
import { pageHead, faqLd, jsonLd, breadcrumbLd, SITE_URL } from "@/lib/seo";
import { Mic, Volume2, Play, Loader2, ArrowRight, Heart, Image as ImageIcon } from "lucide-react";

const FAQS = [
  {
    q: "What are voice notes on Crush?",
    a: "Voice notes are real spoken audio messages from creators. Instead of only reading a text reply, you hear her actual voice — including her saying your name — right inside the chat.",
  },
  {
    q: "Can she really say my name?",
    a: "Yes. Creators reply to you personally, so your name, your day and whatever you told her come back in her own voice. You can hear a sample on this page before you sign up.",
  },
  {
    q: "Can I send voice notes back?",
    a: "Yes. Tap and hold the mic in any chat to record a voice note, and send photos too. Conversation on Crush goes both ways.",
  },
  {
    q: "Do voice notes cost extra?",
    a: "No. Voice notes are included in chat. Joining is free, Crush Gold is $9.99 per week for Friends List access, and coins are only used for gifts.",
  },
  {
    q: "Why voice instead of just text?",
    a: "Everywhere else you get left on read. Hearing someone say your name out loud is the difference between a notification and feeling like a person actually noticed you.",
  },
];

const VOICE_HOSTS = ["demo-jen", "demo-aria", "demo-rubi", "demo-wonderwoman"];

export const Route = createFileRoute("/voice-notes")({
  head: () => {
    const base = pageHead({
      path: "/voice-notes",
      title: "Voice Notes on Crush — Hear Your Crush Say Your Name",
      description:
        "Anywhere else you get left on read. On Crush she sends voice notes — hear her actually say your name, laugh and reply out loud. Play a sample free.",
      keywords:
        "voice notes, voice message chat app, hear her voice, audio messages, creator voice notes, talk to creators, she actually replies, voice chat app",
    });
    return {
      ...base,
      scripts: [
        faqLd(FAQS),
        breadcrumbLd([
          { name: "Crush", path: "/" },
          { name: "Voice notes", path: "/voice-notes" },
        ]),
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Crush Voice Notes",
          url: `${SITE_URL}/voice-notes`,
          description:
            "Spoken voice notes from verified creators inside Crush chat — she says your name, laughs and replies out loud.",
          brand: { "@type": "Brand", name: "Crush" },
          category: "Social chat",
          offers: {
            "@type": "Offer",
            price: "9.99",
            priceCurrency: "USD",
            url: `${SITE_URL}/upgrade`,
            availability: "https://schema.org/InStock",
          },
        }),
      ],
    };
  },
  component: VoiceNotesPage,
});

function VoiceNotesPage() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hostId, setHostId] = useState(VOICE_HOSTS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const host = DEMO_HOSTS.find((h) => h.id === hostId) ?? DEMO_HOSTS[0];

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
    };
  }, []);

  async function hearIt() {
    const clean = name.trim().replace(/[^\p{L}\p{N}\s'-]/gu, "").slice(0, 24);
    setError(null);
    setBusy(true);
    try {
      const line = clean
        ? `Hey ${clean}. I was hoping you'd message me today. Tell me how your day actually went — I'm listening.`
        : `Hey you. I was hoping you'd message me today. Tell me your name and how your day actually went.`;
      const res = await fetch("/api/public/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: line, hostId }),
      });
      if (!res.ok) throw new Error("Voice unavailable");
      const blob = await res.blob();
      audioRef.current?.pause();
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      await audio.play();
    } catch {
      setError("Her voice is busy right now — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <header className="pt-6 rise-in">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80">
          <Volume2 className="h-3 w-3 text-primary" />
          Voice notes
        </span>
        <h1 className="mt-3 text-[2.4rem] leading-[1.04] font-display font-extrabold">
          Hear your crush <span className="text-gradient-brand">say your name</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          In the real world you get a "seen" and nothing else. On Crush she talks back — out loud.
          Voice notes, photos, real conversation with verified creators.
        </p>
      </header>

      {/* Interactive: type your name, hear her say it */}
      <section className="mt-5 rounded-3xl border border-border bg-card/70 p-4 shadow-card backdrop-blur rise-in">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Play a real voice note
        </p>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {VOICE_HOSTS.map((id) => {
            const h = DEMO_HOSTS.find((x) => x.id === id);
            if (!h) return null;
            const active = id === hostId;
            return (
              <div
                key={id}
                className={`flex shrink-0 items-center gap-1 rounded-full border pr-1 transition ${
                  active
                    ? "border-primary bg-gradient-brand-soft text-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setHostId(id)}
                  aria-pressed={active}
                  className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold"
                >
                  <img
                    src={hostAvatarMed(h.id)}
                    alt={h.name}
                    width={24}
                    height={24}
                    loading="lazy"
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  {h.name}
                </button>
                <Link
                  to="/host/$hostId"
                  params={{ hostId: h.id }}
                  aria-label={`View ${h.name}'s profile`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-background/70 text-foreground/70 transition hover:text-primary"
                >
                  <User className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/chat/$hostId"
                  params={{ hostId: h.id }}
                  aria-label={`Chat with ${h.name}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-white shadow-glow"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            to="/host/$hostId"
            params={{ hostId: host.id }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
          >
            <User className="h-3.5 w-3.5" /> View {host.name}'s profile
          </Link>
          <Link
            to="/chat/$hostId"
            params={{ hostId: host.id }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3 py-1.5 text-[11px] font-bold text-foreground transition hover:opacity-90"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Chat {host.name} in your inbox
          </Link>
        </div>


        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Your first name"
            aria-label="Your first name"
            className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={hearIt}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {busy ? "Recording…" : `Hear ${host?.name ?? "her"} say it`}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-white">
            <Volume2 className="h-4 w-4" />
          </span>
          <Waveform active={playing} className="flex-1" />
          <span className="text-[11px] text-muted-foreground">0:06</span>
        </div>

        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <p className="mt-2 text-[11px] text-muted-foreground">
          This is the same voice engine creators use inside chat. No signup needed to listen.
        </p>
      </section>

      {/* Why voice */}
      <section className="mt-7 rise-in">
        <h2 className="text-sm font-display font-bold">Why voice changes everything</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Volume2,
              title: "She says your name",
              body: "Not a template. Your name, in her voice, in a reply meant for you.",
            },
            {
              icon: Mic,
              title: "Send yours back",
              body: "Hold the mic and talk. She hears you too — it's a conversation, not a broadcast.",
            },
            {
              icon: ImageIcon,
              title: "Photos and reactions",
              body: "Share a photo, get a reaction. Voice notes, pictures, everything real chat has.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-3xl border border-border bg-card/60 p-4 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-brand-soft text-primary">
                <c.icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-sm font-bold">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="mt-7 rise-in">
        <h2 className="text-sm font-display font-bold">Real conversations happening now</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Text, voice notes and photos — this is what members wake up to.
        </p>
        <DemoChatProofs />
      </section>

      {/* FAQ (visible, matches the JSON-LD) */}
      <section className="mt-7 rise-in">
        <h2 className="text-sm font-display font-bold">Voice note questions</h2>
        <div className="mt-3 space-y-2">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-border bg-card/60 px-3.5 py-2.5 shadow-card"
            >
              <summary className="cursor-pointer text-sm font-semibold">{f.q}</summary>
              <p className="mt-2 text-xs text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-7 mb-4 rounded-3xl bg-gradient-brand-soft p-5 text-center shadow-card rise-in">
        <Heart className="mx-auto h-5 w-5 text-primary" />
        <p className="mt-2 font-display text-lg font-extrabold">She's online right now.</p>
        <p className="mt-1 text-xs text-muted-foreground">Say something and hear her say it back.</p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-glow"
        >
          Say something <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AppShell>
  );
}
