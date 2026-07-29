import { useCallback, useEffect, useRef, useState } from "react";

export const CHAT_REACTIONS = ["❤️", "😍", "🔥", "😘", "😂", "🥰", "💋", "👀", "🙌", "😉", "💕", "✨"];

export type EmojiMode = "send" | "react";

/** Remembers the send/react preference per conversation. */
export function useEmojiMode(scope: string) {
  const key = `crush:emoji-mode:${scope}`;
  const [mode, setModeState] = useState<EmojiMode>("send");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(key);
    setModeState(saved === "react" ? "react" : "send");
  }, [key]);

  const setMode = useCallback(
    (next: EmojiMode) => {
      setModeState(next);
      try { localStorage.setItem(key, next); } catch { /* storage unavailable */ }
    },
    [key],
  );

  return { mode, setMode };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string, mode: EmojiMode) => void;
  peerName: string;
  disabled?: boolean;
  emojis?: string[];
  mode: EmojiMode;
  onModeChange: (mode: EmojiMode) => void;
};

/**
 * Composer emoji tray. Sits in normal flow directly above the composer so it
 * never covers the transcript, caps its own height and scrolls internally, and
 * closes on pick, Escape, or an outside tap.
 */
export function EmojiTray({
  open,
  onClose,
  onPick,
  peerName,
  disabled,
  emojis = CHAT_REACTIONS,
  mode,
  onModeChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onDown = (e: PointerEvent) => {
      const el = ref.current;
      const target = e.target as HTMLElement | null;
      if (!el || !target) return;
      if (el.contains(target) || target.closest("[data-emoji-toggle]")) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const tabClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-[11px] font-semibold transition ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:text-primary"
    }`;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Emoji reactions"
      className="mx-0 mb-1 max-h-[38dvh] shrink-0 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Emoji behaviour" className="flex items-center gap-1 rounded-full border border-border bg-background/70 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "send"}
            onClick={() => onModeChange("send")}
            className={tabClass(mode === "send")}
          >
            Send as message
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "react"}
            onClick={() => onModeChange("react")}
            className={tabClass(mode === "react")}
          >
            React only
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji tray"
          className="rounded-lg border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
        >
          Close
        </button>
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {mode === "send"
          ? `Tap to send ${peerName} a reaction — it's added to your draft too`
          : "Tap for a floating burst on the latest message — nothing is sent"}
      </p>
      <div className="grid grid-cols-6 gap-1">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            disabled={disabled && mode === "send"}
            onClick={() => { onPick(e, mode); onClose(); }}
            className="rounded-xl py-2 text-2xl transition-transform hover:scale-125 active:scale-95 disabled:opacity-50"
            aria-label={mode === "send" ? `Send ${e} and add it to your message` : `React with ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
