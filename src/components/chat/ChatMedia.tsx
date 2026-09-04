import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signChatMedia } from "@/lib/chat-media.functions";
import { VoiceNotePlayer } from "./VoiceNote";
import {
  CHAT_MEDIA_BUCKET,
  MAX_CHAT_MEDIA_BYTES,
  chatMediaPath,
  kindForFile,
  parseChatBody,
  type ChatAttachment,
} from "@/lib/chat-media";

/** Renders any attachments inside a message body (used by MessageBubble). */
export function ChatMediaAttachments({ body }: { body: string }) {
  const { media } = parseChatBody(body);
  if (!media.length) return null;
  return (
    <div className="mt-1 flex flex-col gap-2">
      {media.map((m) => (
        <ChatMediaItem key={m.path} item={m} />
      ))}
    </div>
  );
}

function ChatMediaItem({ item }: { item: ChatAttachment }) {
  const sign = useServerFn(signChatMedia);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let stop = false;
    sign({ data: { path: item.path } })
      .then((r) => { if (!stop) setUrl(r.url); })
      .catch(() => { if (!stop) setFailed(true); });
    return () => { stop = true; };
  }, [item.path, sign]);

  if (failed) {
    return <p className="text-[11px] text-muted-foreground">Attachment unavailable</p>;
  }
  if (!url) {
    return <div className="h-40 w-56 max-w-full animate-pulse rounded-2xl bg-foreground/10" />;
  }
  if (item.kind === "audio") {
    return <VoiceNotePlayer url={url} />;
  }
  if (item.kind === "video") {
    return (
      <video src={url} controls playsInline className="max-h-72 w-56 max-w-full rounded-2xl bg-black object-cover" />
    );
  }
  return (
    <>
      <button type="button" onClick={() => setZoom(true)} className="block">
        <img loading="lazy" decoding="async" src={url} alt="Shared photo" className="max-h-72 w-56 max-w-full rounded-2xl object-cover" />
      </button>
      {zoom ? (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
        >
          <img loading="lazy" decoding="async" src={url} alt="Shared photo" className="max-h-full max-w-full rounded-2xl object-contain" />
          <button
            type="button"
            aria-label="Close photo"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}

/**
 * Composer button: picks a photo/video, uploads it to the private bucket and
 * hands back the marker to append to the outgoing message.
 */
export function ChatAttachButton({
  disabled,
  onUploaded,
  className,
}: {
  disabled?: boolean;
  onUploaded: (marker: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const kind = kindForFile(file);
    if (!kind || kind === "audio") return toast.error("Only photos and videos can be shared here — use the mic for voice notes.");
    if (file.size > MAX_CHAT_MEDIA_BYTES) return toast.error("File is too large (50 MB max).");

    setBusy(true);
    try {
      const { uploadWithServerModeration } = await import("@/lib/media-moderation");
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sign in to share media.");
      const path = chatMediaPath(uid, file);

      // The server re-reviews images before minting the upload URL.
      await uploadWithServerModeration(file, CHAT_MEDIA_BUCKET, path);
      const { encodeChatMedia } = await import("@/lib/chat-media");
      onUploaded(encodeChatMedia(path, kind));
      toast.success(kind === "video" ? "Video attached" : "Photo attached");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        aria-label="Share a photo or video"
        className={
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 " +
          (className ?? "")
        }
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
      </button>
    </>
  );
}

/** Small chip showing attachments queued for the next send. */
export function PendingAttachments({
  markers,
  onRemove,
}: {
  markers: string[];
  onRemove: (marker: string) => void;
}) {
  if (!markers.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {markers.map((m) => {
        const { media } = parseChatBody(m);
        const kind = media[0]?.kind ?? "image";
        return (
          <span
            key={m}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"
          >
            {kind === "audio" ? "🎤 Voice note ready" : kind === "video" ? "📹 Video ready" : "📷 Photo ready"}
            <button type="button" aria-label="Remove attachment" onClick={() => onRemove(m)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
