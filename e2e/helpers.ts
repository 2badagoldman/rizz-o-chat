import { expect, type Page } from "@playwright/test";

/** Every theme selectable from the header toggle. */
export const THEMES = ["pink", "abyss", "blue", "ocean", "rose", "romance"] as const;
export type ThemeId = (typeof THEMES)[number];

/** Public routes that must always render without a runtime error. */
export const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/chats",
  "/discover",
  "/coins",
  "/profile",
  "/subscriptions",
  "/upgrade",
  "/rooms",
  "/rooms/new",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refunds",
  "/verify",
  "/dashboard",
  "/copilot",
  "/host/onboarding",
  "/host/pricing",
  "/host/rooms",
  "/host/members",
  "/host/invites",
  "/soon/help",
  "/checkout/return",
  "/chat/jen",
] as const;

/** Console/page errors we intentionally tolerate (network noise, not UI bugs). */
const IGNORED = [
  /Failed to load resource/i,
  /favicon/i,
  /net::ERR_/i,
  /ResizeObserver loop/i,
  /Download the React DevTools/i,
  /Unknown message type/i,
];

export type ErrorCollector = { errors: string[] };

/** Attaches console-error + pageerror listeners and returns the collected list. */
export function collectErrors(page: Page): ErrorCollector {
  const bucket: ErrorCollector = { errors: [] };
  const push = (msg: string) => {
    if (!IGNORED.some((re) => re.test(msg))) bucket.errors.push(msg);
  };
  page.on("pageerror", (err) => push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") push(`console: ${msg.text()}`);
  });
  return bucket;
}

/** Sets the persisted theme before the app boots, so first paint uses it. */
export async function setTheme(page: Page, theme: ThemeId) {
  await page.goto("/");
  await page.evaluate((t) => window.localStorage.setItem("rizz.theme", t), theme);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(new RegExp(`theme-${theme}\\b`));
}

/** Waits for the app shell to be interactive on the current route. */
export async function waitForShell(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "visible" });
  await page.waitForTimeout(600);
}

/** All buttons/links a real user can see and reach on the current screen. */
export async function interactiveElements(page: Page) {
  return page.evaluate(() => {
    const out: { label: string; tag: string; href: string | null; inertHidden: boolean }[] = [];
    for (const el of Array.from(document.querySelectorAll("button, a[href]"))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const label =
        (el as HTMLElement).innerText?.trim() || el.getAttribute("aria-label")?.trim() || "";
      if (!label) continue;
      const hiddenAncestor = el.closest('[aria-hidden="true"], [inert]') !== null;
      out.push({
        label: label.slice(0, 40),
        tag: el.tagName,
        href: el.getAttribute("href"),
        inertHidden: hiddenAncestor,
      });
    }
    return out;
  });
}

/** Clicks every reachable button on the page, skipping destructive/paid actions. */
export async function clickAllSafeButtons(page: Page, skip: RegExp, max = 24) {
  const results: { label: string; failure: string }[] = [];
  const startUrl = page.url();
  const total = Math.min(await page.locator("button:visible").count(), max);

  for (let i = 0; i < total; i++) {
    const buttons = page.locator("button:visible");
    if (i >= (await buttons.count())) break;
    const el = buttons.nth(i);
    let label = "";
    try {
      label = ((await el.innerText()) || (await el.getAttribute("aria-label")) || "").trim();
    } catch {
      continue;
    }
    if (!label || skip.test(label)) continue;
    if (await el.isDisabled().catch(() => true)) continue;

    try {
      await el.click({ force: true, timeout: 4000 });
      await page.waitForTimeout(350);
    } catch (err) {
      results.push({ label, failure: String(err).slice(0, 120) });
      continue;
    }

    if (page.url() !== startUrl) {
      await page.goto(startUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  return results;
}
