import { moderateImage, type ModerationVerdict } from "./media-moderation.functions";

/** Downscale an image file to a small JPEG data URL for the safety reviewer. */
async function toReviewDataUrl(file: File, max = 640): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  }
}

/**
 * Runs an image through the non-sexual content gate.
 * Videos and unreadable files pass through (they are still covered by
 * reporting + admin review), images that fail are blocked before upload.
 */
export async function reviewImageBeforeUpload(file: File): Promise<ModerationVerdict> {
  if (!file.type.startsWith("image/")) return { allow: true, category: "ok", reason: "" };
  const dataUrl = await toReviewDataUrl(file);
  if (!dataUrl) return { allow: true, category: "ok", reason: "" };
  try {
    return await moderateImage({ data: { dataUrl } });
  } catch {
    return { allow: true, category: "ok", reason: "" };
  }
}

export const MODERATION_BLOCK_MESSAGE =
  "Crush is a non-sexual, PG-13 platform. This photo can't be published — no nudity, underwear/lingerie, swimwear or suggestive posing.";
