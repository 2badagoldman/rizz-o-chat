import { createServerFn } from "@tanstack/react-start";

/**
 * Marketing "proof of concept" demos.
 *
 * Pulls the highest-performing showcase photos that are held back from the
 * public feed and pairs each one with a scripted 4-message conversation.
 * These are used for advertising screenshots, the admin demo page and the
 * social-proof strip at the bottom of the marketing home page.
 */

export type { DemoLine, DemoProof } from "./demo-proofs.data";
import type { DemoProof } from "./demo-proofs.data";
import { loadDemoProofs } from "./demo-proofs.server";

export const getDemoProofs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { limit?: number };
    const n = typeof i.limit === "number" && i.limit > 0 && i.limit <= 24 ? i.limit : 6;
    return { limit: n };
  })
  .handler(async ({ data }): Promise<DemoProof[]> => loadDemoProofs(data.limit));
