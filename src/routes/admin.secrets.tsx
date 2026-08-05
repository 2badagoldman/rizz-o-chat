import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRuntimeSecrets } from "@/lib/secrets.functions";
import { KeyRound, Check, X, Copy, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/secrets")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Secret Manager — Crush" }] }),
  component: AdminSecrets,
});

type Runtime = { name: string; purpose: string; managed: boolean; configured: boolean };

const BUILD_SECRETS: ReadonlyArray<{ name: string; where: string; how: string }> = [
  { name: "ANDROID_KEYSTORE_BASE64", where: "GitHub → Settings → Secrets → Actions", how: "base64 of your release .jks keystore (`base64 -i release.jks`)" },
  { name: "ANDROID_KEYSTORE_PASSWORD", where: "GitHub Actions secret", how: "Password used when the keystore was created" },
  { name: "ANDROID_KEY_ALIAS", where: "GitHub Actions secret", how: "Alias of the signing key inside the keystore" },
  { name: "ANDROID_KEY_PASSWORD", where: "GitHub Actions secret", how: "Password for that key alias" },
  { name: "IOS_CERT_P12_BASE64", where: "GitHub Actions secret", how: "base64 of the Apple Distribution .p12 certificate" },
  { name: "IOS_CERT_PASSWORD", where: "GitHub Actions secret", how: "Password set when exporting the .p12" },
  { name: "IOS_PROVISIONING_PROFILE_BASE64", where: "GitHub Actions secret", how: "base64 of the App Store provisioning profile" },
  { name: "IOS_TEAM_ID", where: "GitHub Actions secret", how: "10-char Apple Developer Team ID" },
];

function copy(text: string) {
  void copyText(text).then((ok) =>
    ok ? toast.success("Copied") : toast.error("Copy blocked — select and copy manually"),
  );
}

function AdminSecrets() {
  const fetchSecrets = useServerFn(listRuntimeSecrets);
  const [rows, setRows] = useState<Runtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecrets({ data: {} } as never)
      .then((r) => setRows(r as Runtime[]))
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [fetchSecrets]);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Security</p>
      <h1 className="text-2xl font-bold flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Secret Manager</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Values are encrypted and never displayed — this shows what is configured and what your dev still needs.
      </p>

      <section className="mt-5 rounded-2xl border border-border bg-card overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" /> App runtime secrets
        </h2>
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((s) => (
              <li key={s.name} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.configured ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive"}`}>
                  {s.configured ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold break-all">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.purpose}</p>
                </div>
                {s.managed && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Managed</span>
                )}
                <button onClick={() => copy(s.name)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" aria-label={`Copy ${s.name}`}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          These stay in Crush. Your dev does <strong>not</strong> need them for the mobile builds.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-primary/40 bg-gradient-brand-soft overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Secrets your dev needs (mobile builds)</h2>
          <button onClick={() => copy(BUILD_SECRETS.map((b) => b.name).join("\n"))} className="rounded-lg border border-border bg-card px-2 py-1 text-xs">Copy all</button>
        </div>
        <ul className="divide-y divide-border">
          {BUILD_SECRETS.map((b) => (
            <li key={b.name} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-semibold break-all">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.how}</p>
                <p className="text-[11px] text-muted-foreground/80">{b.where}</p>
              </div>
              <button onClick={() => copy(b.name)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" aria-label={`Copy ${b.name}`}>
                <Copy className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Added under GitHub → Settings → Secrets and variables → Actions, then run <span className="font-mono">Actions → Mobile builds</span> to get the .aab and .ipa.
        </p>
      </section>
    </div>
  );
}
