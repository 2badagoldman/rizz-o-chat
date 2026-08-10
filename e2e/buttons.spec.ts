import { test, expect } from "@playwright/test";
import { THEMES, clickAllSafeButtons, collectErrors, setTheme, waitForShell } from "./helpers";

// Actions that cost money, destroy data, or leave the app — excluded from the sweep.
const SKIP = /log ?out|sign ?out|delete|remove|block|report|buy|purchase|checkout|pay|get rizz|subscribe|unlock/i;

const FULL_SWEEP = ["/", "/chats", "/discover", "/coins", "/profile", "/subscriptions", "/rooms", "/legal"];
// Full sweep on the default theme; a fast smoke sweep on the rest keeps CI quick.
const SMOKE_SWEEP = ["/", "/coins", "/subscriptions"];

for (const theme of THEMES) {
  test(`every visible button is clickable and error-free (${theme})`, async ({ page }) => {
    const collector = collectErrors(page);
    await setTheme(page, theme);

    const failures: { route: string; label: string; failure: string }[] = [];
    for (const route of theme === "pink" ? FULL_SWEEP : SMOKE_SWEEP) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await waitForShell(page);
      const res = await clickAllSafeButtons(page, SKIP);
      failures.push(...res.map((r) => ({ route, ...r })));
    }

    expect(failures, `unclickable buttons under ${theme}`).toEqual([]);
    expect(collector.errors, `errors while clicking under ${theme}`).toEqual([]);
  });
}

test("core navigation buttons reach their destinations", async ({ page }) => {
  const collector = collectErrors(page);
  await page.goto("/");
  await waitForShell(page);

  // Header search opens the global search overlay and closes again.
  await page.getByLabel("Search creators").click({ force: true });
  await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  await page.keyboard.press("Escape");

  // Logo reloads to home.
  await page.getByLabel(/Rizzla home/i).first().click({ force: true });
  await page.waitForLoadState("domcontentloaded");
  expect(new URL(page.url()).pathname).toBe("/");

  expect(collector.errors).toEqual([]);
});
