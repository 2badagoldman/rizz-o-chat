import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import rizzAiLogo from "@/assets/rizz-ai-logo.webp.asset.json";

const FLAG_KEY = "rizzla:showWelcome";
const AUTO_ADVANCE_MS = 10_000;

interface ShowcaseItem {
  id: string;
  caption: string | null;
  media_type: "image" | "video";
  storage_path: string;
  url: string;
}

export function markWelcomeShowcasePending() {
  try {
    localStorage.setItem(FLAG_KEY, "1");
  } catch {}
}

export function WelcomeShowcase() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  // Decide whether to show
  useEffect(() => {
    if (loading || !user) return;
    let pending = false;
    try {
      pending = localStorage.getItem(FLAG_KEY) === "1";
    } catch {}
    if (!pending) return;

    (async () => {
      const { data, error } = await supabase
        .from("showcase_media")
        .select("id, caption, media_type, storage_path")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(20);
      if (error || !data || data.length === 0) {
        try { localStorage.removeItem(FLAG_KEY); } catch {}
        return;
      }
      const signed = await Promise.all(
        data.map(async (row) => {
          const { data: s } = await supabase.storage
            .from("showcase")
            .createSignedUrl(row.storage_path, 60 * 60);
          return { ...row, url: s?.signedUrl ?? "" } as ShowcaseItem;
        }),
      );
      const usable = signed.filter((s) => s.url);
      if (usable.length === 0) {
        try { localStorage.removeItem(FLAG_KEY); } catch {}
        return;
      }
      setItems(usable);
      setOpen(true);
    })();
  }, [loading, user]);

  const close = () => {
    setOpen(false);
    try { localStorage.removeItem(FLAG_KEY); } catch {}
    // pause any playing video
    Object.values(videoRefs.current).forEach((v) => v?.pause());
  };

  // Autoplay + auto-advance
  useEffect(() => {
    if (!open || items.length === 0) return;
    const current = videoRefs.current[index];
    // Pause siblings, play current
    Object.entries(videoRefs.current).forEach(([k, v]) => {
      if (Number(k) !== index) {
        v?.pause();
        if (v) v.currentTime = 0;
      }
    });
    if (current) {
      current.muted = muted;
      current.play().catch(() => {});
    }
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [open, index, items.length, muted]);

  // Scroll to current slide
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index, open]);

  // Update index on manual scroll
  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    const i = Math.round(el.scrollTop / h);
    if (i !== index && i >= 0 && i < items.length) setIndex(i);
  };

  const progress = useMemo(() => items.map((_, i) => i), [items]);

  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white">
      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
          <img src={rizzAiLogo.url} alt="Rizzla" className="h-6 w-6 rounded-full" />
          <span className="text-xs font-semibold">Welcome to Rizzla</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={close}
            aria-label="Close welcome"
            className="grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* progress dots */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center gap-1 px-4">
        {progress.map((i) => (
          <span
            key={i}
            className={`h-0.5 flex-1 max-w-16 rounded-full transition-all ${i === index ? "bg-white" : i < index ? "bg-white/70" : "bg-white/25"}`}
          />
        ))}
      </div>

      {/* vertical snap reel */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => (
          <div key={item.id} className="relative h-full w-full snap-start">
            {item.media_type === "video" ? (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={item.url}
                className="h-full w-full object-cover"
                playsInline
                loop
                muted={muted}
                preload={Math.abs(i - index) <= 1 ? "auto" : "none"}
              />
            ) : (
              <img
                src={item.url}
                alt={item.caption ?? "Rizzla showcase"}
                className="h-full w-full object-cover animate-[kenburns_10s_ease-out_forwards]"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
            <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-6 pb-24">
              <p className="text-xs uppercase tracking-widest text-white/70">Rizzla · {i + 1} / {items.length}</p>
              <p className="text-lg font-semibold leading-tight drop-shadow-lg">
                {item.caption ?? "Welcome to your new favorite space."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* nav buttons */}
      <div className="pointer-events-none absolute inset-y-0 right-2 z-20 flex flex-col items-center justify-center gap-3">
        <button
          onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
          aria-label="Previous"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % items.length)}
          aria-label="Next"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* CTA */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-4">
        <button onClick={close} className="btn-brand w-full max-w-[420px]">
          Start exploring
        </button>
      </div>
    </div>
  );
}
