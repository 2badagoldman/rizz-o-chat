import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type Theme = "pink" | "blue" | "ocean" | "abyss" | "rose" | "romance";
const KEY = "rizz.theme";

const ALL: Theme[] = ["pink", "blue", "ocean", "abyss", "rose", "romance"];
const EXTRA: { id: Theme; label: string; swatch: string }[] = [
  { id: "blue", label: "Blue", swatch: "linear-gradient(135deg,#2563eb,#7dd3fc)" },
  { id: "ocean", label: "Ocean", swatch: "linear-gradient(135deg,#073b4c,#35c3b6)" },
  { id: "rose", label: "Rose", swatch: "linear-gradient(135deg,#fbe6e2,#d97e7e)" },
  { id: "romance", label: "Romance", swatch: "linear-gradient(135deg,#4a0f2e,#e35f8c,#f6cf9a)" },
];

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ALL.forEach((t) => root.classList.toggle(`theme-${t}`, t === theme));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("pink");
  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    const next = saved && ALL.includes(saved) ? saved : "pink";
    setTheme(next);
    apply(next);
  }, []);
  const update = (t: Theme) => {
    setTheme(t);
    apply(t);
    try { localStorage.setItem(KEY, t); } catch { /* noop */ }
  };
  return { theme, setTheme: update };
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  };

  useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const extraActive = EXTRA.some((t) => t.id === theme);


  return (
    <div ref={ref} className="relative">
      <div
        role="group"
        aria-label="Color theme"
        className="inline-flex items-center rounded-full border border-border bg-card/80 p-0.5 text-[10px] font-semibold"
      >
        <button
          type="button"
          onClick={() => { setTheme("pink"); setOpen(false); }}
          aria-pressed={theme === "pink"}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            theme === "pink" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
          }`}
        >
          Pink
        </button>
        <button
          type="button"
          onClick={() => { setTheme("abyss"); setOpen(false); }}
          aria-pressed={theme === "abyss"}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            theme === "abyss" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
          }`}
        >
          Sea
        </button>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="More themes"
          className={`flex items-center gap-0.5 rounded-full px-1.5 py-1 transition-colors ${
            extraActive ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
          }`}
        >
          {extraActive ? EXTRA.find((t) => t.id === theme)!.label : ""}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: pos?.top ?? 60, right: pos?.right ?? 12 }}
              className="fixed z-[200] w-44 animate-scale-in overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-pop"
            >
              {EXTRA.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                    theme === t.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="h-4 w-4 shrink-0 rounded-full border border-border" style={{ background: t.swatch }} />
                  {t.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}

    </div>
  );
}
