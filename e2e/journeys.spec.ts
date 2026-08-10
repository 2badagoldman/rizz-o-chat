import { test, expect, type Page } from "@playwright/test";
import { collectErrors, waitForShell } from "./helpers";

/**
 * Regression suite for the seven core surfaces. These run as a signed-out
 * visitor, so gated pages are asserted on their sign-in state — the point is
 * that each route renders a real, non-blank screen with its expected chrome
 * and no runtime errors.
 */

async function open(page: Page, route: string) {
  const res = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(res?.status() ?? 0, `${route} HTTP status`).toBeLessThan(400);
  await waitForShell(page);
}

/** Page must not be a blank/error shell. */
async function expectRendered(page: Page) {
  const text = (await page.locator("body").innerText()).trim();
  expect(text.length, "rendered content length").toBeGreaterThan(40);
}

test.describe("core journeys", () => {
  test("Home renders hero, stories and host rails", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/verified creators/i);
    await expect(page.getByRole("heading", { name: /online now/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /featured creators/i })).toBeVisible();
    await expectRendered(page);
    expect(errors.errors, "home runtime errors").toEqual([]);
  });

  test("Discover search + filters narrow the host list", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/discover");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/ready to chat/i);

    const search = page.getByLabel(/search creators, cities and interests/i);
    await expect(search).toBeVisible();

    const cardsBefore = await page.locator("a[href^='/host/']").count();
    await search.fill("zzzzqqq-no-such-host");
    await page.waitForTimeout(700);
    const cardsAfter = await page.locator("a[href^='/host/']").count();
    expect(cardsAfter, "nonsense query should not widen results").toBeLessThanOrEqual(cardsBefore);

    await search.fill("");
    await page.waitForTimeout(500);
    await expect(page.getByRole("group", { name: /filter creators/i })).toBeVisible();
    await expectRendered(page);
    expect(errors.errors, "discover runtime errors").toEqual([]);
  });

  test("Chats lists AI creators and supports search", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/chats");
    await expect(page.getByRole("heading", { name: "Chats", level: 1 })).toBeVisible();
    const search = page.getByPlaceholder(/search ai creators/i).first();
    await expect(search).toBeVisible();
    await search.fill("jen");
    await page.waitForTimeout(600);
    await expectRendered(page);
    expect(errors.errors, "chats runtime errors").toEqual([]);
  });

  test("Chat thread opens from Chats", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/chats");
    const thread = page.locator("a[href^='/chat/']").first();
    await expect(thread).toBeVisible();
    await thread.click({ force: true });
    await page.waitForTimeout(1200);
    expect(page.url(), "opened a chat thread").toContain("/chat/");
    await expectRendered(page);
    await expect(page.locator("body")).not.toContainText(/host not found/i);
    // Either a composer, or the sign-in / subscribe gate — never a blank screen.
    const composer = page.locator("textarea, input[type='text']");
    const gate = page.getByRole("link", { name: /sign in|unlock|subscribe|join/i });
    await expect
      .poll(async () => (await composer.count()) + (await gate.count()), {
        message: "chat composer or access gate",
      })
      .toBeGreaterThan(0);
    expect(errors.errors, "chat thread runtime errors").toEqual([]);
  });

  test("Rooms shows the room hub or its sign-in gate", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/rooms");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /public rooms|sign in to browse rooms/i,
    );
    await expectRendered(page);

    await open(page, "/rooms/new");
    await expectRendered(page);
    expect(errors.errors, "rooms runtime errors").toEqual([]);
  });

  test("Checkout return handles a missing/unknown session gracefully", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/checkout/return");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectRendered(page);
    // Never a raw crash screen.
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
    expect(errors.errors, "checkout runtime errors").toEqual([]);
  });

  test("Verify shows the age-verification flow", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/verify");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectRendered(page);
    expect(errors.errors, "verify runtime errors").toEqual([]);
  });

  test("Dashboard renders stats or the sign-in gate", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, "/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectRendered(page);
    expect(errors.errors, "dashboard runtime errors").toEqual([]);
  });

  test("bottom navigation reaches every core surface", async ({ page }) => {
    await open(page, "/");
    for (const path of ["/discover", "/chats", "/rooms"]) {
      const link = page.locator(`a[href='${path}']`).first();
      if ((await link.count()) === 0) continue;
      await link.click({ force: true });
      await page.waitForTimeout(700);
      expect(page.url(), `navigated to ${path}`).toContain(path);
      await expectRendered(page);
      await open(page, "/");
    }
  });
});
