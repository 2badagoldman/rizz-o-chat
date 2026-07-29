import { Check, CheckCheck, Clock } from "lucide-react";
import { useRef, useState } from "react";
import { ChatMediaAttachments } from "./ChatMedia";
import { parseChatBody } from "@/lib/chat-media";

export type DeliveryState = "sending" | "sent" | "seen";

export const QUICK_REACTIONS = ["❤️", "😍", "😂", "🔥", "😮", "😢", "👍"];

export function MessageBubble({
  mine,
  text,
  time,
  state,
  reactions,
  onReact,
}: {
  mine: boolean;
  text: string;
  time?: string;
  state?: DeliveryState;
  /** Emojis already attached to this message. */
  reactions?: string[];
  /** Fired with the chosen emoji + the viewport point the burst should rise from. */
  onReact?: (emoji: string, origin: { x: number; y: number }) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const lastTap = useRef(0);
  const longPress = useRef<number | null>(null);

  const origin = () => {
    const r = bubbleRef.current?.getBoundingClientRect();
    return r
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  const react = (emoji: string) => {
    setPickerOpen(false);
    onReact?.(emoji, origin());
  };

  // Apple-style: double tap loves the message, long press opens the picker.
  const handleTap = () => {
    if (!onReact) return;
    const now = Date.now();
    if (now - lastTap.current < 320) {
      lastTap.current = 0;
      react("❤️");
      return;
    }
    lastTap.current = now;
  };

  const startPress = () => {
    if (!onReact) return;
    longPress.current = window.setTimeout(() => setPickerOpen(true), 450);
  };
  const endPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current);
    longPress.current = null;
  };

  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className="relative max-w-[80%]">
        {pickerOpen ? (
          <>
            <button
              type="button"
              aria-label="Close reactions"
              className="fixed inset-0 z-[95] cursor-default"
              onClick={() => setPickerOpen(false)}
            />
            <div
              className={`absolute -top-12 z-[96] flex items-center gap-0.5 rounded-full border border-border bg-card/95 px-1.5 py-1 shadow-xl backdrop-blur animate-in fade-in zoom-in-95 ${mine ? "right-0" : "left-0"}`}
            >
              {QUICK_REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`React ${e}`}
                  onClick={() => react(e)}
                  className="rounded-full px-1.5 py-0.5 text-xl transition-transform hover:scale-125 active:scale-95"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div
          ref={bubbleRef}
          onClick={handleTap}
          onDoubleClick={() => onReact && react("❤️")}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onContextMenu={(e) => {
            if (!onReact) return;
            e.preventDefault();
            setPickerOpen(true);
          }}
          className={
            (mine
              ? "chat-bubble-mine rounded-[22px] rounded-br-md px-4 py-2.5"
              : "chat-bubble-peer rounded-[22px] rounded-bl-md px-4 py-2.5 shadow-sm") +
            (onReact ? " select-none [-webkit-touch-callout:none] active:scale-[.99] transition-transform" : "")
          }
        >
          {(() => {
            const parsed = parseChatBody(text);
            return (
              <>
                {parsed.text || !parsed.media.length ? (
                  <p className="chat-type whitespace-pre-wrap break-words">{parsed.text || "…"}</p>
                ) : null}
                <ChatMediaAttachments body={text} />
              </>
            );
          })()}
          {time || (mine && state) ? (
            <div
              className={
                mine
                  ? "mt-1 flex items-center justify-end gap-1 chat-meta opacity-75"
                  : "mt-1 flex items-center justify-end gap-1 chat-meta opacity-60"
              }
            >

              {time ? <span>{time}</span> : null}
              {mine && state === "sending" ? <Clock className="h-3 w-3" /> : null}
              {mine && state === "sent" ? <Check className="h-3 w-3" /> : null}
              {mine && state === "seen" ? (
                <CheckCheck className="h-3.5 w-3.5" aria-label="Seen" />
              ) : null}
            </div>
          ) : null}
        </div>

        {reactions && reactions.length ? (
          <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
            {reactions.map((e, i) => (
              <span
                key={`${e}-${i}`}
                className="emoji-pop rounded-full border border-border bg-card/95 px-2 py-0.5 text-sm leading-none shadow-sm"
              >
                {e}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-[22px] rounded-bl-md border border-border bg-card px-4 py-3">
        <span className="sr-only">{name} is typing</span>
        <span className="flex items-end gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: `${i * 140}ms`, animationDuration: "900ms" }}
            />
          ))}
        </span>
        <span className="chat-meta text-muted-foreground">{name} is typing</span>
      </div>
    </div>
  );
}
