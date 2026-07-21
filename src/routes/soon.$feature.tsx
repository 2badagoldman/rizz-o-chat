import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const FEATURES: Record<string, { title: string; tagline: string; emoji: string }> = {
  news: { title: "Rizzla News", tagline: "Stories, spotlights & host tea — delivered daily.", emoji: "📰" },
  store: { title: "Rizzla Store", tagline: "Merch, coin bundles & exclusive drops from your favorite hosts.", emoji: "🛍️" },
  events: { title: "Rizzla Events", tagline: "Live parties, watch-alongs and IRL meetups.", emoji: "🎉" },
  games: { title: "Rizzla Games", tagline: "Playful mini-games to win coins & unlock hosts.", emoji: "🎮" },
  "gift-shop": { title: "Gift Shop", tagline: "Send real gifts to your favorite hosts — flowers, chocolates & more.", emoji: "🎁" },
  help: { title: "Help Center", tagline: "Guides, FAQs and live support.", emoji: "💬" },
};

export const Route = createFileRoute("/soon/$feature")({
  head: ({ params }) => {
    const f = FEATURES[params.feature] ?? { title: "Coming Soon", tagline: "" };
    return {
      meta: [
        { title: `${f.title} — Coming Soon | Rizzla` },
        { name: "description", content: `Get early access to ${f.title}. ${f.tagline}` },
      ],
    };
  },
  component: SoonPage,
});

function SoonPage() {
  const { feature } = Route.useParams();
  const { user } = useAuth();
  const meta = FEATURES[feature] ?? { title: "Coming Soon", tagline: "This feature is on the way.", emoji: "✨" };
  const [email, setEmail] = useState(user?.email ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.trim()) {
      setErr("Enter your email so we can notify you.");
      return;
    }
    setStatus("saving");
    const { error } = await supabase.from("early_access_signups").insert({
      feature,
      email: email.trim(),
      note: note.trim() || null,
      user_id: user?.id ?? null,
    });
    if (error) {
      setStatus("error");
      setErr(error.message);
      return;
    }
    setStatus("done");
  }

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <section className="mt-4 rounded-3xl border border-primary/30 bg-gradient-brand-soft p-6 text-center overflow-hidden relative">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <img src={rizzAiLogo.url} alt="" className="mx-auto h-16 w-16 rounded-full ring-4 ring-white/40" />
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Coming Soon
          </p>
          <h1 className="mt-3 font-display text-3xl font-black tracking-tight">
            {meta.emoji} {meta.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{meta.tagline}</p>
        </div>
      </section>

      {status === "done" ? (
        <div className="mt-5 rounded-2xl border border-primary/40 bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-lg font-bold">You're on the list!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll email you the moment {meta.title} goes live.
          </p>
          <Link to="/" className="btn-brand mt-4 inline-flex">Back to Rizzla</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-border bg-card p-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Get early access
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              What would you love here? (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={`Tell us what you want from ${meta.title}…`}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none resize-none"
            />
          </div>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <button
            type="submit"
            disabled={status === "saving"}
            className="btn-brand w-full disabled:opacity-60"
          >
            {status === "saving" ? "Adding you…" : "Notify me when it drops"}
          </button>
          <p className="text-center text-[10px] text-muted-foreground">
            No spam. Just one message when {meta.title} launches.
          </p>
        </form>
      )}
    </AppShell>
  );
}
