import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useKyc } from "@/hooks/useKyc";
import { ShieldCheck, Upload, Camera, BadgeCheck, Clock, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify your age — Rizzla" },
      {
        name: "description",
        content:
          "Rizzla is 18+ only. Upload a government ID and a selfie to confirm your age and keep full access to chats, rooms and Friends Lists.",
      },
      { property: "og:title", content: "Verify your age — Rizzla" },
      { property: "og:description", content: "18+ only. Confirm your age in about a minute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

function ageFrom(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function VerifyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const kyc = useKyc();

  const [legalName, setLegalName] = useState("");
  const [dob, setDob] = useState("");
  const [docType, setDocType] = useState("id_card");
  const [doc, setDoc] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const docRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth", search: { next: "/verify" } });
  }, [loading, user, router]);

  const upload = async (file: File, kind: string) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user!.id}/${kind}-${Date.now()}.${ext}`;
    const { error: err } = await supabase.storage.from("kyc").upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (err) throw err;
    return path;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const age = ageFrom(dob);
    if (age < 0) return setError("Enter your date of birth.");
    if (age < 18) return setError("Rizzla is strictly 18+. We cannot verify this account.");
    if (!legalName.trim()) return setError("Enter the name printed on your ID.");
    if (!doc) return setError("Upload a photo of your government ID.");
    if (doc.size > 10_000_000 || (selfie && selfie.size > 10_000_000))
      return setError("Each image must be under 10MB.");

    setBusy(true);
    try {
      const documentPath = await upload(doc, "document");
      const selfiePath = selfie ? await upload(selfie, "selfie") : null;
      const { error: err } = await supabase.from("kyc_submissions").insert({
        user_id: user!.id,
        legal_name: legalName.trim().slice(0, 120),
        date_of_birth: dob,
        document_type: docType,
        document_path: documentPath,
        selfie_path: selfiePath,
      });
      if (err) throw err;
      kyc.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not submit your verification.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (kyc.status === "approved") {
    return (
      <AppShell>
        <Panel
          icon={<BadgeCheck className="h-7 w-7 text-primary" />}
          title="You're verified"
          body="Your age is confirmed. Everything on Rizzla is unlocked — enjoy."
        >
          <Link to="/" className="btn-brand mt-5 inline-flex w-full justify-center">
            Back to Rizzla
          </Link>
        </Panel>
      </AppShell>
    );
  }

  if (kyc.status === "pending") {
    return (
      <AppShell>
        <Panel
          icon={<Clock className="h-7 w-7 text-primary" />}
          title="Age check in review"
          body="Our trust team is reviewing your documents — usually under 24 hours. You keep full access while we check."
        >
          <Link to="/" className="btn-brand mt-5 inline-flex w-full justify-center">
            Keep exploring
          </Link>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="pt-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
          <ShieldCheck className="h-7 w-7 text-primary-foreground" />
        </span>
        <h1 className="mt-4 text-3xl">Verify your age</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Rizzla is 18+ only. Everyone confirms their age within 7 days of joining — takes about
          a minute, and your documents stay private.
        </p>
        {kyc.status === "rejected" ? (
          <p className="mt-4 flex items-center gap-2 rounded-[14px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-left text-[12px] text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Your last submission couldn't be verified. Please upload a clearer photo of your ID.
          </p>
        ) : (
          <p className="mt-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {kyc.daysLeft > 0
              ? `${kyc.daysLeft} ${kyc.daysLeft === 1 ? "day" : "days"} left in your grace period`
              : "Final hours of your grace period"}
          </p>
        )}
      </header>

      <form onSubmit={submit} className="mt-6 grid gap-3">
        <input
          required
          placeholder="Full legal name (as on ID)"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        />
        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Date of birth
          </span>
          <input
            required
            type="date"
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDob(e.target.value)}
            className="rounded-[14px] border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["id_card", "ID card"],
              ["passport", "Passport"],
              ["drivers_license", "License"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDocType(value)}
              className={`press-spring rounded-[14px] border px-2 py-2.5 text-[12px] font-semibold ${
                docType === value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <FilePick
          label="Photo of your ID"
          hint="All four corners visible, no glare"
          file={doc}
          icon={<Upload className="h-4 w-4" />}
          inputRef={docRef}
          onPick={setDoc}
        />
        <FilePick
          label="Selfie (recommended)"
          hint="Helps us match your ID faster"
          file={selfie}
          icon={<Camera className="h-4 w-4" />}
          inputRef={selfieRef}
          onPick={setSelfie}
        />

        {error ? (
          <p className="rounded-[10px] bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}

        <button type="submit" disabled={busy} className="btn-brand mt-1 disabled:opacity-50">
          {busy ? "Uploading…" : "Submit for verification"}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Your ID is stored privately and only used to confirm you are 18 or older. See our{" "}
          <Link to="/legal/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AppShell>
  );
}

function Panel({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-10 rounded-[24px] border border-border bg-card/90 p-6 text-center shadow-glow">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">{icon}</span>
      <h1 className="mt-4 text-2xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

function FilePick({
  label,
  hint,
  file,
  icon,
  inputRef,
  onPick,
}: {
  label: string;
  hint: string;
  file: File | null;
  icon: React.ReactNode;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="press-spring flex items-center gap-3 rounded-[16px] border border-dashed border-border bg-card/70 px-4 py-3 text-left"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{file ? file.name : label}</span>
        <span className="block text-[11px] text-muted-foreground">{file ? "Tap to replace" : hint}</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}
