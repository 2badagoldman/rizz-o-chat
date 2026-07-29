import { useEffect, useRef } from "react";

export const CHAT_REACTIONS = ["❤️", "😍", "🔥", "😘", "😂", "🥰", "💋", "👀", "🙌", "😉", "💕", "✨"];

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  peerName: string;
  disabled?: boolean;
  emojis?: string[];
};

/**
 * Composer emoji tray. Sits in normal flow directly above the composer so it
 * never covers the transcript, caps its own height and scrolls internally, and
 * closes on pick, Escape, or an outside tap.
 */
export function EmojiTray({ open, onClose, onPick, peerName, disabled, emojis = CHAT_REACTIONS }: Props) {
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

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Emoji reactions"
      className="mx-0 mb-1 max-h-[38dvh] shrink-0 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Tap to send {peerName} a reaction — it&apos;s added to your draft too
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji tray"
          className="rounded-lg border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
        >
          Close
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            disabled={disabled}
            onClick={() => { onPick(e); onClose(); }}
            className="rounded-xl py-2 text-2xl transition-transform hover:scale-125 active:scale-95 disabled:opacity-50"
            aria-label={`Send ${e} and add it to your message`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
