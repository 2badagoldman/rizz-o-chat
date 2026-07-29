import { test, expect } from "@playwright/test";
import { PUBLIC_ROUTES, THEMES, collectErrors, setTheme, waitForShell } from "./helpers";

// Every route must render cleanly under every theme.
const CORE_ROUTES = PUBLIC_ROUTES.slice(0, 8);

for (const theme of THEMES) {
  test.describe(`theme: ${theme}`, () => {
    test(`all routes render without runtime errors (${theme})`, async ({ page }) => {
      const collector = collectErrors(page);
      await setTheme(page, theme);

      const broken: string[] = [];
      for (const route of theme === "pink" ? PUBLIC_ROUTES : CORE_ROUTES) {
        const response = await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitForShell(page);

        const status = response?.status() ?? 0;
        if (status >= 400) broken.push(`${route} -> HTTP ${status}`);

        // The theme class must survive client-side navigation.
        await expect(page.locator("html")).toHaveClass(new RegExp(`theme-${theme}\\b`));

        // Page must render actual content, not a blank/error shell.
        const text = (await page.locator("body").innerText()).trim();
        if (text.length < 20) broken.push(`${route} -> rendered empty`);
      }

      expect(broken, `broken routes under ${theme}`).toEqual([]);
      expect(collector.errors, `runtime errors under ${theme}`).toEqual([]);
    });
  });
}

test("in-app links all point at real routes (no 404s)", async ({ page }) => {
  await page.goto("/");
  await waitForShell(page);

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href^='/']"))
      .map((a) => a.getAttribute("href")!)
      .filter((h) => !h.startsWith("//")),
  );

  const unique = Array.from(new Set(hrefs)).slice(0, 40);
  const notFound: string[] = [];
  for (const href of unique) {
    const res = await page.request.get(href);
    if (res.status() >= 400) notFound.push(`${href} -> ${res.status()}`);
  }
  expect(notFound, "links resolving to error pages").toEqual([]);
});
