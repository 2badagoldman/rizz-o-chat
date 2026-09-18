import { Capacitor } from "@capacitor/core";

const STORAGE_KEY = "rizzla.app-review.v1";
const REVIEW_READY_EVENT = "rizzla:review-ready";
const REQUIRED_SUCCESSFUL_SENDS = 5;
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

type ReviewState = {
  successfulSends: number;
  dismissedAt?: number;
  requestedAt?: number;
};

function readState(): ReviewState {
  if (typeof window === "undefined") return { successfulSends: 0 };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<ReviewState>;
    return {
      successfulSends: Math.max(0, Number(parsed.successfulSends) || 0),
      dismissedAt: typeof parsed.dismissedAt === "number" ? parsed.dismissedAt : undefined,
      requestedAt: typeof parsed.requestedAt === "number" ? parsed.requestedAt : undefined,
    };
  } catch {
    return { successfulSends: 0 };
  }
}

function writeState(state: ReviewState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing can deny storage; reviewing remains optional.
  }
}

export function isNativeReviewPlatform() {
  if (typeof window === "undefined") return false;
  const platform = Capacitor.getPlatform();
  return Capacitor.isNativePlatform() && (platform === "ios" || platform === "android");
}

export function isReviewPromptEligible() {
  const state = readState();
  if (state.requestedAt || state.successfulSends < REQUIRED_SUCCESSFUL_SENDS) return false;
  return !state.dismissedAt || Date.now() - state.dismissedAt >= DISMISS_COOLDOWN_MS;
}

/** Record only completed sends, never taps or failed messages. */
export function recordSuccessfulChatSend() {
  if (typeof window === "undefined") return;
  const state = readState();
  if (state.requestedAt) return;
  state.successfulSends += 1;
  writeState(state);
  if (state.successfulSends >= REQUIRED_SUCCESSFUL_SENDS) {
    window.dispatchEvent(new CustomEvent(REVIEW_READY_EVENT));
  }
}

export function dismissReviewPrompt() {
  const state = readState();
  state.dismissedAt = Date.now();
  writeState(state);
}

export async function requestNativeReview() {
  if (!isNativeReviewPlatform()) return false;
  const { InAppReview } = await import("@capacitor-community/in-app-review");
  await InAppReview.requestReview();
  const state = readState();
  state.requestedAt = Date.now();
  writeState(state);
  return true;
}

export function onReviewReady(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(REVIEW_READY_EVENT, listener);
  return () => window.removeEventListener(REVIEW_READY_EVENT, listener);
}
