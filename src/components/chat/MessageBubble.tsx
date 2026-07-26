import { Check, CheckCheck, Clock } from "lucide-react";

export type DeliveryState = "sending" | "sent" | "seen";

export function MessageBubble({
  mine,
  text,
  time,
  state,
}: {
  mine: boolean;
  text: string;
  time?: string;
  state?: DeliveryState;
}) {
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          mine
            ? "max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2 text-sm text-white shadow-glow"
            : "max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2 text-sm"
        }
      >
        <p className="whitespace-pre-wrap break-words">{text || "…"}</p>
        {time || (mine && state) ? (
          <div
            className={
              mine
                ? "mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/75"
                : "mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground"
            }
          >
            {time ? <span>{time}</span> : null}
            {mine && state === "sending" ? <Clock className="h-3 w-3" /> : null}
            {mine && state === "sent" ? <Check className="h-3 w-3" /> : null}
            {mine && state === "seen" ? (
              <CheckCheck className="h-3 w-3 text-sky-200" aria-label="Seen" />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5">
        <span className="sr-only">{name} is typing</span>
        <span className="flex items-end gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: `${i * 140}ms`, animationDuration: "900ms" }}
            />
          ))}
        </span>
        <span className="text-[11px] text-muted-foreground">{name} is typing</span>
      </div>
    </div>
  );
}
