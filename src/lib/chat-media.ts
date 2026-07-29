/**
 * Chat attachments (photos + videos).
 *
 * Attachments live in the private `chat-media` bucket under `<uploaderId>/…`
 * and are referenced inside the message body with a compact marker so every
 * chat surface (DMs, host chats, rooms — all of which store plain text) can
 * carry media without a schema change.
 *
 *   "look at this\n[[media:uuid/168…-beach.jpg|image]]"
 */

export type ChatMediaKind = "image" | "video";

export type ChatAttachment = { path: string; kind: ChatMediaKind };

const MARKER = /\[\[media:([^|\]]+)\|(image|video)\]\]/g;

export const CHAT_MEDIA_BUCKET = "chat-media";
export const MAX_CHAT_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB

export function encodeChatMedia(path: string, kind: ChatMediaKind) {
  return `[[media:${path}|${kind}]]`;
}

/** Splits a raw message body into its caption text and any attachments. */
export function parseChatBody(body: string): { text: string; media: ChatAttachment[] } {
  const media: ChatAttachment[] = [];
  const text = (body ?? "")
    .replace(MARKER, (_m, path: string, kind: string) => {
      media.push({ path, kind: kind as ChatMediaKind });
      return "";
    })
    .trim();
  return { text, media };
}

export function hasChatMedia(body: string) {
  MARKER.lastIndex = 0;
  return MARKER.test(body ?? "");
}

/** Short label used in thread previews where media can't be rendered. */
export function previewChatBody(body: string) {
  const { text, media } = parseChatBody(body);
  if (text) return text;
  if (!media.length) return "";
  return media[0].kind === "video" ? "📹 Video" : "📷 Photo";
}

export function kindForFile(file: File): ChatMediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function chatMediaPath(userId: string, file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
}
