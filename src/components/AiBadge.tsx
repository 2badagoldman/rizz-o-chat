import { Bot } from "lucide-react";

/**
 * Persistent "AI companion" label.
 *
 * Required disclosure: any conversation powered by our AI persona engine must
 * be visibly labelled wherever the profile appears (card, profile header, chat
 * header) so members always know they are not talking to a human.
 */
export function AiBadge({
  className = "",
  tone = "solid",
  label = "AI companion",
}: {
  className?: string;
  tone?: "solid" | "glass";
  label?: string;
}) {
  return (
    <span
      title="This is an AI-generated companion, not a real person."
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        tone === "glass"
          ? "bg-black/50 text-white backdrop-blur"
          : "border border-primary/40 bg-primary/10 text-primary"
      } ${className}`}
    >
      <Bot className="h-3 w-3" />
      {label}
    </span>
  );
}

/** One-line in-context disclosure for AI chats. */
export function AiDisclosure({ name }: { name: string }) {
  return (
    <div className="mx-auto my-2 max-w-[46ch] rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground backdrop-blur">
      <b className="text-foreground">{name} is an AI companion</b> — an AI-generated character, not a real person.
      Replies are produced by software. Non-sexual, 18+ conversation only. Never share personal or financial details.
    </div>
  );
}
