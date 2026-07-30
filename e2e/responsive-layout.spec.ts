import { test, expect, type Page } from "@playwright/test";
import { waitForShell } from "./helpers";

/**
 * Responsive layout regression suite.
 *
 * Catches the two classes of bug that keep coming back on small screens:
 *  1. Horizontal overflow (content wider than the viewport).
 *  2. Overlap — a fixed/sticky overlay (bottom nav, AI dock, chat composer)
 *     sitting on top of real content or on top of another overlay.
 */

const BREAKPOINTS = [
  { name: "mobile-small", width: 320, height: 720 },
  { name: "mobile", width: 375, height: 812 },
  { name: "mobile-large", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

/** Routes that render the full shell (header + bottom nav + dock + footer). */
const SHELL_ROUTES = ["/", "/discover", "/chats", "/profile", "/upgrade", "/coins", "/legal"];
/** Conversation routes own the bottom of the screen with a sticky composer. */
const CONVERSATION_ROUTES = ["/chat/jen", "/copilot"];

type Box = { x: number; y: number; w: number; h: number };

const overlaps = (a: Box, b: Box, tolerance = 2) =>
  a.x + a.w - tolerance > b.x &&
  b.x + b.w - tolerance > a.x &&
  a.y + a.h - tolerance > b.y &&
  b.y + b.h - tolerance > a.y;

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const offenders: string[] = [];
    // Elements inside an intentional horizontal scroller (carousels, filter
    // rails) are allowed to extend past the fold.
    const inScroller = (el: Element) => {
      let node: Element | null = el.parentElement;
      while (node && node !== document.body) {
        const ox = getComputedStyle(node).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
        node = node.parentElement;
      }
      return false;
    };
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      // Decorative/atmosphere layers and off-canvas panels are intentional.
      if (el.closest('[aria-hidden="true"], [inert]')) continue;
      if (el.closest('aside[role="dialog"]')) continue;
      if (inScroller(el)) continue;
      if (rect.right > docWidth + 2 || rect.left < -2) {
        offenders.push(
          `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".")} [${Math.round(rect.left)}..${Math.round(rect.right)}] > ${docWidth}`,
        );
      }
      if (offenders.length >= 5) break;
    }
    return offenders;
  });
}

/** Bounding boxes of the sticky/fixed chrome the app renders. */
async function chromeBoxes(page: Page) {
  return page.evaluate(() => {
    const pick = (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return null;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    return {
      header: pick("header.sticky"),
      bottomNav: pick('nav[aria-label="Primary"]'),
      dock: pick("[data-ai-dock]"),
      composer: pick("form.sticky"),
      footer: pick("footer"),
    };
  });
}

for (const bp of BREAKPOINTS) {
  test.describe(`responsive @ ${bp.name} (${bp.width}x${bp.height})`, () => {
    test.use({ viewport: { width: bp.width, height: bp.height } });

    test("shell routes have no horizontal overflow", async ({ page }) => {
      const broken: string[] = [];
      for (const route of SHELL_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
        const offenders = await horizontalOverflow(page);
        if (offenders.length) broken.push(`${route}: ${offenders.join(" | ")}`);
      }
      expect(broken, `horizontal overflow at ${bp.name}`).toEqual([]);
    });

    test("bottom nav never covers the footer or the AI dock", async ({ page }) => {
      const broken: string[] = [];
      for (const route of SHELL_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
        // Scroll to the very bottom: that is where stacking bugs surface.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(400);

        const { bottomNav, dock, footer, header } = await chromeBoxes(page);
        if (!bottomNav) {
          broken.push(`${route}: bottom nav missing`);
          continue;
        }
        if (footer && overlaps(bottomNav, footer)) broken.push(`${route}: nav overlaps footer`);
        if (dock && overlaps(bottomNav, dock)) broken.push(`${route}: nav overlaps AI dock`);
        if (header && overlaps(header, bottomNav)) broken.push(`${route}: header overlaps nav`);
        // The nav must sit fully inside the viewport.
        if (bottomNav.y + bottomNav.h > bp.height + 2)
          broken.push(`${route}: nav clipped below viewport`);
      }
      expect(broken, `bottom-chrome overlap at ${bp.name}`).toEqual([]);
    });

    test("conversation screens keep the composer clear of other chrome", async ({ page }) => {
      const broken: string[] = [];
      for (const route of CONVERSATION_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
        const { composer, bottomNav, dock, footer } = await chromeBoxes(page);
        if (!composer) continue; // signed-out state renders a sign-in card instead
        if (bottomNav) broken.push(`${route}: bottom nav rendered over the composer`);
        if (dock) broken.push(`${route}: AI dock rendered over the composer`);
        if (footer && overlaps(composer, footer)) broken.push(`${route}: footer under composer`);
        if (composer.y + composer.h > bp.height + 2)
          broken.push(`${route}: composer clipped below viewport`);
      }
      expect(broken, `composer overlap at ${bp.name}`).toEqual([]);
    });

    test("primary header controls stay visible and tappable", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const tooSmall = await page.evaluate(() => {
        const header = document.querySelector("header.sticky");
        if (!header) return ["header missing"];
        const bad: string[] = [];
        for (const el of Array.from(header.querySelectorAll<HTMLElement>("button, a[href]"))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const label = el.getAttribute("aria-label") || el.innerText.trim().slice(0, 20) || el.tagName;
          if (r.height < 20 || r.width < 20) bad.push(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
          if (r.right > document.documentElement.clientWidth + 2) bad.push(`${label} overflows right edge`);
        }
        return bad;
      });
      expect(tooSmall, `header controls at ${bp.name}`).toEqual([]);
    });

    test("open side drawer covers the page without clipping its own controls", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
      await page.getByRole("button", { name: /open menu/i }).click({ force: true });
      // Drawer slide-in transition is 550ms.
      await page.waitForTimeout(1000);

      const offenders = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const h = document.documentElement.clientHeight;
        const panel = document.querySelector<HTMLElement>('aside[role="dialog"]');
        if (!panel) return ["drawer panel not found"];
        const bad: string[] = [];
        const pr = panel.getBoundingClientRect();
        if (pr.right > w + 2 || pr.left < -2) bad.push("drawer overflows horizontally");
        if (pr.height > h + 2) bad.push("drawer taller than viewport");
        for (const el of Array.from(panel.querySelectorAll<HTMLElement>("button, a[href]"))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > w + 2) bad.push(`${el.innerText.trim().slice(0, 20) || "control"} clipped`);
        }
        return bad.slice(0, 5);
      });
      expect(offenders, `side drawer at ${bp.name}`).toEqual([]);
    });
  });
}
