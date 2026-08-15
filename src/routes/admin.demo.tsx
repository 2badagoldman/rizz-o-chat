import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DemoChatProofs } from "@/components/DemoChatProofs";
import { Play, Pause, RotateCcw, ChevronRight, Users, MessageSquare, Sparkles, Heart } from "lucide-react";

export const Route = createFileRoute("/admin/demo")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Demo Workflow — Crush Admin" }] }),
  component: AdminDemo,
});

type Line = { from: "them" | "you" | "system"; who?: string; text: string; delay: number };

const DISCOVER: Line[] = [
  { from: "system", text: "Sofia opens Crush and lands on Discover — 60+ verified creators, online right now.", delay: 900 },
  { from: "system", text: "She taps Wonder Woman, 26 — online, verified, replies in seconds.", delay: 1200 },
];

const DM: Line[] = [
  { from: "you", text: "hey Wonder Woman — you actually reply? 😄", delay: 900 },
  { from: "them", who: "Wonder Woman", text: "Always. I'm not a bot farm, I'm your problem now 😌", delay: 1400 },
  { from: "you", text: "bold. what are you up to tonight?", delay: 1300 },
  { from: "them", who: "Wonder Woman", text: "Wine, playlist, and someone worth texting. You qualify so far.", delay: 1600 },
  { from: "system", text: "Free preview ends → paywall: Rizz Gold $9.99/wk unlocks unlimited DMs + her Friends List.", delay: 1500 },
];

const ROOM: Line[] = [
  { from: "system", text: "Sofia joins the public room “Friday Night Flirts” — 214 members online.", delay: 1100 },
  { from: "them", who: "Nova", text: "ok settle a debate: text first or call first? 📞", delay: 1300 },
  { from: "them", who: "Jen", text: "call. texting is for cowards 😂", delay: 1200 },
  { from: "you", text: "call first, but only after one good text 😏", delay: 1300 },
  { from: "them", who: "Wonder Woman", text: "correct answer. someone give this one a crown 👑", delay: 1400 },
  { from: "system", text: "Gifts fly, DMs open from the room, and Sofia upgrades to keep the conversation going.", delay: 1500 },
];

const STEPS = [
  { key: "discover", title: "1 · Discover", subtitle: "Find the women of their dreams", icon: Users, lines: DISCOVER, link: "/discover", params: {}, linkLabel: "Open Discover" },
  { key: "chat", title: "2 · Chat 1:1", subtitle: "Send a message, get a real reply", icon: MessageSquare, lines: DM, link: "/chat/$hostId", params: { hostId: "demo-aria" }, linkLabel: "Open Wonder Woman's chat" },
  { key: "rooms", title: "3 · Join a group", subtitle: "Live rooms with creators + members", icon: Sparkles, lines: ROOM, link: "/rooms", params: {}, linkLabel: "Open Rooms" },
] as const;

function Bubble({ line }: { line: Line }) {
  if (line.from === "system") {
    return (
      <div className="my-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
        {line.text}
      </div>
    );
  }
  const mine = line.from === "you";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
        {!mine && line.who ? <span className="mb-0.5 block text-[11px] font-semibold text-primary">{line.who}</span> : null}
        {line.text}
      </div>
    </div>
  );
}

function AdminDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const scroller = useRef<HTMLDivElement | null>(null);

  const step = STEPS[stepIdx];
  const lines = step.lines as unknown as Line[];
  const done = shown >= lines.length;

  useEffect(() => {
    if (!playing || done) return;
    const t = setTimeout(() => setShown((s) => s + 1), (lines[shown]?.delay ?? 1000) / speed);
    return () => clearTimeout(t);
  }, [playing, done, shown, lines, speed]);

  useEffect(() => {
    if (!playing || !done) return;
    if (stepIdx >= STEPS.length - 1) return;
    const t = setTimeout(() => { setStepIdx((i) => i + 1); setShown(0); }, 1800 / speed);
    return () => clearTimeout(t);
  }, [playing, done, stepIdx, speed]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [shown, stepIdx]);

  const goto = useCallback((i: number) => { setStepIdx(i); setShown(0); setPlaying(true); }, []);
  const restart = useCallback(() => { setStepIdx(0); setShown(0); setPlaying(true); }, []);

  const progress = useMemo(() => {
    const total = STEPS.reduce((a, s) => a + s.lines.length, 0);
    const before = STEPS.slice(0, stepIdx).reduce((a, s) => a + s.lines.length, 0);
    return Math.round(((before + shown) / total) * 100);
  }, [stepIdx, shown]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Sales & onboarding</p>
          <h1 className="text-2xl font-bold">Demo Workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A guided walkthrough of how a new member goes from Discover → 1:1 chat → joining a live group room.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={restart} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold">
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </button>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-2 py-2 text-xs"
            aria-label="Playback speed"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <nav className="space-y-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === stepIdx;
            return (
              <button
                key={s.key}
                onClick={() => goto(i)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/50"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 text-primary" /> {s.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.subtitle}</span>
              </button>
            );
          })}
          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Use it live</p>
            <p className="mt-1">Play this on a call, then jump into the real screens with the buttons on the right.</p>
          </div>
        </nav>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold">{step.title} — {step.subtitle}</h2>
              <p className="text-[11px] text-muted-foreground">Scripted preview · no real messages are sent</p>
            </div>
            <Link
              to={step.link as string}
              params={step.params as never}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              {step.linkLabel} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </header>

          <div ref={scroller} className="mt-3 max-h-[460px] min-h-[320px] space-y-2 overflow-y-auto pr-1">
            {lines.slice(0, shown).map((l, i) => <Bubble key={`${step.key}-${i}`} line={l} />)}
            {!done ? (
              <div className="flex items-center gap-1.5 pl-1 pt-1 text-muted-foreground">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
              </div>
            ) : null}
          </div>

          {done && stepIdx === STEPS.length - 1 ? (
            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="flex items-center gap-2 text-sm font-bold"><Heart className="h-4 w-4 text-primary" /> That's the close</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Taste the conversation → hit the limit → upgrade to Rizz Gold ($9.99/wk) for unlimited DMs, Friends Lists and every live room.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/upgrade" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">See plans</Link>
                <button onClick={restart} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Replay demo</button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Proof of concept</p>
        <h2 className="text-lg font-bold">Creator chat demos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Our highest-performing creator photos paired with real 4-message exchanges — use these as
          ad creative, store screenshots and live sales demos. Also shown at the bottom of the marketing home page.
        </p>
        <DemoChatProofs limit={18} title="" subtitle="" showCta={false} />
      </div>
    </div>
  );
}
