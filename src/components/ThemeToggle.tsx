import { useEffect, useState } from "react";

type Theme = "pink" | "blue";
const KEY = "rizz.theme";

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("theme-blue", theme === "blue");
  root.classList.toggle("theme-pink", theme === "pink");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("pink");
  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "pink";
    setTheme(saved);
    apply(saved);
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
  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center rounded-full border border-border bg-card/80 p-0.5 text-[10px] font-semibold"
    >
      <button
        type="button"
        onClick={() => setTheme("pink")}
        aria-pressed={theme === "pink"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          theme === "pink" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
        }`}
      >
        Pink
      </button>
      <button
        type="button"
        onClick={() => setTheme("blue")}
        aria-pressed={theme === "blue"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          theme === "blue" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
        }`}
      >
        Blue
      </button>
    </div>
  );
}
