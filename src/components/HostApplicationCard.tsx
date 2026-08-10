import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, Loader2, Sparkle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Application = {
  id: string;
  status: string;
  review_notes: string | null;
  created_at: string;
};

/** Members apply here. Creator abilities stay locked until an admin approves. */
export function HostApplicationCard() {
  const { user } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stageName, setStageName] = useState("");
  const [city, setCity] = useState("");
  const [social, setSocial] = useState("");
  const [pitch, setPitch] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("host_applications")
      .select("id, status, review_notes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setApp((data as Application) ?? null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase
      .from("host_applications")
      .insert({
        user_id: user.id,
        stage_name: stageName.trim(),
        city: city.trim() || null,
        social_handle: social.trim() || null,
        pitch: pitch.trim(),
      })
      .select("id, status, review_notes, created_at")
      .maybeSingle();
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setApp((data as Application) ?? null);
    setOpen(false);
  };

  if (loading) return null;

  if (app?.status === "pending") {
    return (
      <Shell tone="pending" icon={<Clock className="h-4 w-4" />} title="Creator application under review">
        <p className="mt-1 text-xs text-muted-foreground">
          Submitted {new Date(app.created_at).toLocaleDateString()}. You stay a member — pricing, rooms, invites and payouts
          unlock the moment our team approves you.
        </p>
      </Shell>
    );
  }

  if (app?.status === "rejected") {
    return (
      <Shell tone="rejected" icon={<XCircle className="h-4 w-4" />} title="Creator application declined">
        <p className="mt-1 text-xs text-muted-foreground">{app.review_notes || "You can apply again any time."}</p>
        <button onClick={() => setOpen(true)} className="press-spring mt-3 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">
          Apply again
        </button>
        {open && <Form {...{ stageName, setStageName, city, setCity, social, setSocial, pitch, setPitch, submit, busy, err }} />}
      </Shell>
    );
  }

  if (app?.status === "approved") {
    return (
      <Shell tone="approved" icon={<BadgeCheck className="h-4 w-4" />} title="You're an approved creator">
        <p className="mt-1 text-xs text-muted-foreground">Creator tools are unlocked in your dashboard.</p>
        <Link to="/host/pricing" className="text-gradient-brand mt-2 inline-block text-xs font-semibold">
          Set your Friends List price →
        </Link>
      </Shell>
    );
  }

  return (
    <Shell tone="cta" icon={<Sparkle className="h-4 w-4" />} title="Want to creator on Crush?">
      <p className="mt-1 text-xs text-muted-foreground">
        Creators earn from their Friends List, gifts and rooms. Apply below — a human reviews every application, and nothing
        changes on your account until you&apos;re approved.
      </p>
      {open ? (
        <Form {...{ stageName, setStageName, city, setCity, social, setSocial, pitch, setPitch, submit, busy, err }} />
      ) : (
        <button onClick={() => setOpen(true)} className="press-spring mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground">
          Apply to become a creator
        </button>
      )}
    </Shell>
  );
}

function Shell({
  tone,
  icon,
  title,
  children,
}: {
  tone: "pending" | "approved" | "rejected" | "cta";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const border =
    tone === "rejected" ? "border-destructive/40" : tone === "approved" ? "border-primary/50" : "border-border";
  return (
    <section className={`mt-5 rounded-2xl border ${border} bg-card/70 p-4 backdrop-blur-xl`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      {children}
    </section>
  );
}

function Form(p: {
  stageName: string;
  setStageName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  social: string;
  setSocial: (v: string) => void;
  pitch: string;
  setPitch: (v: string) => void;
  submit: (e: React.FormEvent) => void;
  busy: boolean;
  err: string | null;
}) {
  const input =
    "mt-2 w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <form onSubmit={p.submit} className="mt-3">
      <input required maxLength={60} value={p.stageName} onChange={(e) => p.setStageName(e.target.value)} placeholder="Stage name" className={input} />
      <input maxLength={60} value={p.city} onChange={(e) => p.setCity(e.target.value)} placeholder="City (optional)" className={input} />
      <input maxLength={60} value={p.social} onChange={(e) => p.setSocial(e.target.value)} placeholder="Instagram / TikTok handle (optional)" className={input} />
      <textarea
        required
        maxLength={600}
        rows={3}
        value={p.pitch}
        onChange={(e) => p.setPitch(e.target.value)}
        placeholder="Why would you be a great creator?"
        className={input}
      />
      {p.err && <p className="mt-2 text-xs font-semibold text-destructive">{p.err}</p>}
      <button
        type="submit"
        disabled={p.busy}
        className="press-spring mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground disabled:opacity-60"
      >
        {p.busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit application
      </button>
    </form>
  );
}
