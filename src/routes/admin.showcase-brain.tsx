import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getBrainStatus, runBrainNow, updateBrainSettings } from "@/lib/showcase-brain.functions";
import { Brain, Play, Sparkles, Image as ImageIcon, Loader2, TrendingUp, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/showcase-brain")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Showcase Brain — Rizzla Admin" }] }),
  component: Page,
});

interface Settings {
  enabled: boolean;
  cadence_minutes: number;
  reel_size: number;
  refresh_caption_after_hours: number;
  tone: string;
  last_run_at: string | null;
  last_run_note: string | null;
}
interface Run { id: string; ran_at: string; trigger: string; items_scored: number; captions_refreshed: number; note: string | null }
interface Item {
  id: string;
  caption: string | null;
  original_caption: string | null;
  ai_score: number;
  impressions: number;
  dismisses: number;
  completes: number;
  ai_caption_updated_at: string | null;
  is_active: boolean;
  storage_path: string;
}

function Page() {
  const fetchStatus = useServerFn(getBrainStatus);
  const run = useServerFn(runBrainNow);
  const save = useServerFn(updateBrainSettings);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchStatus();
      setSettings(r.settings as Settings);
      setRuns(r.runs as Run[]);
      setItems(r.items as Item[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doRun = async () => {
    setRunning(true);
    try { await run(); await load(); } finally { setRunning(false); }
  };

  const patch = async (p: Partial<Settings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...p });
    await save({ data: p as never });
    setSavedAt(new Date().toLocaleTimeString());
  };

  const activeCount = items.filter((i) => i.is_active).length;
  const avgScore = activeCount > 0 ? items.filter(i => i.is_active).reduce((s, i) => s + i.ai_score, 0) / activeCount : 0;
  const totalImpressions = items.reduce((s, i) => s + i.impressions, 0);

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading brain…</p>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-sky-500 text-white shadow-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Showcase Brain</h1>
            <p className="text-xs text-muted-foreground">Auto-ranks slides, rewrites captions, keeps the welcome reel fresh.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/showcase" className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent">Manage library</Link>
          <button onClick={load} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent inline-flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
          <button onClick={doRun} disabled={running} className="btn-brand inline-flex items-center gap-1.5 text-xs">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run brain now
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<ImageIcon className="h-4 w-4" />} label="Active slides" value={String(activeCount)} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Avg score" value={avgScore.toFixed(2)} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Total impressions" value={String(totalImpressions)} />
        <Stat icon={<Brain className="h-4 w-4" />} label="Last run" value={settings?.last_run_at ? new Date(settings.last_run_at).toLocaleString() : "never"} />
      </section>

      {/* Settings */}
      {settings && (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Autonomy</h2>
            {savedAt && <span className="text-[10px] text-muted-foreground">Saved {savedAt}</span>}
          </div>

          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Brain enabled</p>
              <p className="text-xs text-muted-foreground">When on, the cron job re-scores + refreshes captions autonomously.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
              className="h-5 w-9 appearance-none rounded-full bg-muted checked:bg-primary transition-all relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all checked:before:translate-x-4"
            />
          </label>

          <Field label="Cadence (minutes between runs)" hint="How often the autonomous brain wakes up.">
            <input type="number" min={15} max={1440} value={settings.cadence_minutes}
              onChange={(e) => patch({ cadence_minutes: Number(e.target.value) })}
              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm" />
          </Field>

          <Field label="Reel size (top-N slides shown)" hint="How many top-scored slides make the shuffled welcome reel.">
            <input type="number" min={3} max={25} value={settings.reel_size}
              onChange={(e) => patch({ reel_size: Number(e.target.value) })}
              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm" />
          </Field>

          <Field label="Refresh captions after (hours)" hint="Re-write captions on top slides that haven't been touched by AI in this long.">
            <input type="number" min={1} max={720} value={settings.refresh_caption_after_hours}
              onChange={(e) => patch({ refresh_caption_after_hours: Number(e.target.value) })}
              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm" />
          </Field>

          <Field label="Tone" hint="Guides the AI copywriter voice.">
            <input type="text" value={settings.tone}
              onChange={(e) => patch({ tone: e.target.value })}
              className="flex-1 min-w-[240px] rounded-lg border border-border bg-background px-2 py-1 text-sm" />
          </Field>

          {settings.last_run_note && (
            <p className="text-[11px] text-muted-foreground border-t border-border pt-3">Last run: {settings.last_run_note}</p>
          )}
        </section>
      )}

      {/* Ranked slides */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold mb-3">Ranked slides ({items.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <div key={it.id} className={"rounded-xl border border-border overflow-hidden bg-background " + (it.is_active ? "" : "opacity-50")}>
              <div className="p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-bold">{it.ai_score.toFixed(2)}</span>
                  <span className="text-muted-foreground">👁 {it.impressions} · ✓ {it.completes} · ✕ {it.dismisses}</span>
                </div>
                <p className="text-xs font-semibold line-clamp-2 min-h-[32px]">{it.caption ?? <span className="text-muted-foreground italic">no caption</span>}</p>
                {it.ai_caption_updated_at && (
                  <p className="text-[10px] text-muted-foreground">AI refreshed {new Date(it.ai_caption_updated_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Run log */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold mb-3">Recent brain runs</h2>
        {runs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No runs yet. Click "Run brain now" above.</p>
        ) : (
          <ul className="divide-y divide-border text-xs">
            {runs.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <span className="text-muted-foreground shrink-0">{new Date(r.ran_at).toLocaleString()}</span>
                <span className="font-mono truncate">{r.note ?? `${r.trigger} · scored ${r.items_scored} · refreshed ${r.captions_refreshed}`}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">{icon}{label}</div>
      <p className="mt-1 text-lg font-extrabold truncate">{value}</p>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
