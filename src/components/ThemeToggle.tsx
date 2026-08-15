import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type Theme = "pink" | "blue" | "ocean" | "abyss" | "sico" | "romance" | "crush" | "crushgold";
const KEY = "rizz.theme";

const ALL: Theme[] = ["pink", "blue", "ocean", "abyss", "sico", "romance", "crush", "crushgold"];
const EXTRA: { id: Theme; label: string; swatch: string }[] = [
  { id: "pink", label: "Pink", swatch: "linear-gradient(135deg,#ff9ecb,#ff5fa8)" },
  { id: "sico", label: "Sico Mode", swatch: "linear-gradient(135deg,#ffd6b0,#ff9ecb,#ff5fa8,#a97bff)" },
  { id: "romance", label: "Romance", swatch: "linear-gradient(135deg,#0a0104,#d4132f,#e8b98a)" },
  { id: "blue", label: "Blue", swatch: "linear-gradient(135deg,#2563eb,#7dd3fc)" },
  { id: "ocean", label: "Ocean", swatch: "linear-gradient(135deg,#073b4c,#35c3b6)" },
];


function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ALL.forEach((t) => root.classList.toggle(`theme-${t}`, t === theme));
}

const SHOW_KEY = "rizz.theme.autoShow";
const SHOW_STEP_MS = 120_000; // 2 minutes

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("sico");
  const [autoShow, setAutoShow] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const manual = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    const next = saved && saved !== "crush" && ALL.includes(saved) ? saved : "sico";
    setTheme(next);
    apply(next);
    setAutoShow(localStorage.getItem(SHOW_KEY) !== "off");
  }, []);

  // Theme show: sico -> crush after 2 min -> sea after 2 more min, then stays.
  // It only runs on the marketing landing screens and stops for good on the
  // first real interaction — swapping the palette mid-chat felt like a reload.
  useEffect(() => {
    clearTimers();
    if (!autoShow || manual.current) return;
    const path = window.location.pathname;
    if (path !== "/" && path !== "/crush-home") return;

    const step = (t: Theme) => {
      if (manual.current) return;
      if (window.location.pathname !== path) return;
      setTheme(t);
      apply(t);
    };
    const stop = () => {
      manual.current = true;
      clearTimers();
    };
    window.addEventListener("pointerdown", stop, { once: true });
    window.addEventListener("keydown", stop, { once: true });

    timers.current.push(setTimeout(() => step("crushgold"), SHOW_STEP_MS));
    timers.current.push(setTimeout(() => step("abyss"), SHOW_STEP_MS * 2));
    return () => {
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
      clearTimers();
    };
  }, [autoShow]);



  const update = (t: Theme) => {
    manual.current = true;
    clearTimers();
    setTheme(t);
    apply(t);
    try { localStorage.setItem(KEY, t); } catch { /* noop */ }
  };

  const toggleAutoShow = () => {
    setAutoShow((v) => {
      const next = !v;
      manual.current = false;
      try { localStorage.setItem(SHOW_KEY, next ? "on" : "off"); } catch { /* noop */ }
      return next;
    });
  };

  return { theme, setTheme: update, autoShow, toggleAutoShow };
}


export function ThemeToggle() {
  const { theme, setTheme, autoShow, toggleAutoShow } = useTheme();
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
          onClick={() => { setTheme("abyss"); setOpen(false); }}
          aria-pressed={theme === "abyss"}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            theme === "abyss" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
          } hidden sm:block`}
        >
          Sea
        </button>
        <button
          type="button"
          onClick={() => { setTheme("crushgold"); setOpen(false); }}
          aria-pressed={theme === "crushgold"}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            theme === "crushgold" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
          } hidden sm:block`}
        >
          Crush
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
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={autoShow}
                onClick={toggleAutoShow}
                className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <span
                  className={`mt-0.5 h-4 w-7 shrink-0 rounded-full border border-border transition-colors ${autoShow ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`block h-3 w-3 translate-y-[1px] rounded-full bg-background transition-transform ${autoShow ? "translate-x-[15px]" : "translate-x-[2px]"}`}
                  />
                </span>
                <span className="leading-tight">
                  Theme show
                  <span className="block text-[10px] font-medium text-muted-foreground">
                    Crush → Sea (2 min) → Crush
                  </span>
                </span>
              </button>

            </div>,
            document.body,
          )
        : null}

    </div>
  );
}
