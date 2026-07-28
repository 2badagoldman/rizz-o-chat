import { useEffect, useState } from "react";
import { Palette, Check, Contrast } from "lucide-react";

export type ChatSkin = "brand" | "midnight" | "ocean" | "sunset" | "mint" | "lavender" | "noir";

export const CHAT_SKINS: { id: ChatSkin; label: string; swatch: string }[] = [
  { id: "brand", label: "Rizzla", swatch: "linear-gradient(135deg,#ff6b35,#e84393,#6c5ce7)" },
  { id: "midnight", label: "Midnight", swatch: "linear-gradient(135deg,#6366f1,#a855f7)" },
  { id: "ocean", label: "Ocean", swatch: "linear-gradient(135deg,#0ea5e9,#1d4ed8)" },
  { id: "sunset", label: "Sunset", swatch: "linear-gradient(135deg,#fb7185,#f59e0b)" },
  { id: "mint", label: "Mint", swatch: "linear-gradient(135deg,#34d399,#059669)" },
  { id: "lavender", label: "Lavender", swatch: "linear-gradient(135deg,#c084fc,#818cf8)" },
  { id: "noir", label: "Noir", swatch: "linear-gradient(135deg,#2b2b2f,#131316)" },
];

const KEY = "rizz.chatSkin";
const CONTRAST_KEY = "rizz.chatContrast";

export function useChatSkin() {
  const [skin, setSkin] = useState<ChatSkin>("brand");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as ChatSkin | null;
      if (saved && CHAT_SKINS.some((s) => s.id === saved)) setSkin(saved);
      const savedContrast = localStorage.getItem(CONTRAST_KEY);
      if (savedContrast === "1" || savedContrast === "0") {
        setHighContrast(savedContrast === "1");
      } else if (typeof window !== "undefined" && window.matchMedia) {
        // Auto: respect the OS "increase contrast" preference by default.
        setHighContrast(window.matchMedia("(prefers-contrast: more)").matches);
      }
    } catch {
      /* noop */
    }
  }, []);

  const updateContrast = (v: boolean) => {
    setHighContrast(v);
    try {
      localStorage.setItem(CONTRAST_KEY, v ? "1" : "0");
    } catch {
      /* noop */
    }
  };

  const update = (s: ChatSkin) => {
    setSkin(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* noop */
    }
  };

  return {
    skin,
    setSkin: update,
    highContrast,
    setHighContrast: updateContrast,
    contrastAttr: highContrast ? "high" : undefined,
  };
}

export function ChatSkinPicker({
  skin,
  onChange,
  highContrast = false,
  onHighContrastChange,
  className = "",
}: {
  skin: ChatSkin;
  onChange: (s: ChatSkin) => void;
  highContrast?: boolean;
  onHighContrastChange?: (v: boolean) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat theme"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background transition hover:border-primary hover:text-primary"
      >
        <Palette className="h-4 w-4" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close chat themes"
            className="fixed inset-0 z-[90] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-[91] w-52 rounded-2xl border border-border bg-card p-2 shadow-xl backdrop-blur animate-in fade-in zoom-in-95">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Chat theme
            </p>
            {CHAT_SKINS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition hover:bg-muted"
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-border"
                  style={{ backgroundImage: s.swatch }}
                />
                <span className="flex-1">{s.label}</span>
                {skin === s.id ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            ))}

            {onHighContrastChange ? (
              <>
                <div className="my-2 h-px bg-border" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={highContrast}
                  onClick={() => onHighContrastChange(!highContrast)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition hover:bg-muted"
                >
                  <Contrast className="h-5 w-5 shrink-0" />
                  <span className="flex-1 leading-tight">
                    Auto high contrast
                    <span className="block text-[10px] font-medium text-muted-foreground">
                      AA-safe text on every theme
                    </span>
                  </span>
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                      highContrast ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
                        highContrast ? "left-[1.125rem]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
