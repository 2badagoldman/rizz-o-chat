import { expect, test } from "@playwright/test";
import { collectErrors, setTheme, THEMES, waitForShell } from "./helpers";

const cards = (page: import("@playwright/test").Page) =>
  page.locator('a[href^="/host/"]');

test.describe("discover search, filters and sorting", () => {
  test("search narrows results and clears cleanly", async ({ page }) => {
    const collector = collectErrors(page);
    await page.goto("/discover");
    await waitForShell(page);

    const total = await cards(page).count();
    expect(total).toBeGreaterThan(5);

    const search = page.getByLabel("Search hosts", { exact: true });
    await search.fill("zzzz-no-such-host");
    await expect(page.getByText("No hosts match")).toBeVisible();
    await expect(cards(page)).toHaveCount(0);

    // The empty state offers a real escape hatch.
    await page.getByRole("button", { name: /Clear search & filters/i }).click();
    await expect(cards(page)).toHaveCount(total);
    await expect(search).toHaveValue("");

    // A real term narrows without emptying.
    await search.fill("a");
    const narrowed = await cards(page).count();
    expect(narrowed).toBeGreaterThan(0);
    expect(narrowed).toBeLessThanOrEqual(total);

    // The inline clear button restores everything.
    await page.getByLabel("Clear search").click();
    await expect(cards(page)).toHaveCount(total);

    expect(collector.errors).toEqual([]);
  });

  test("tier filters and the online filter change the result set", async ({ page }) => {
    const collector = collectErrors(page);
    await page.goto("/discover");
    await waitForShell(page);

    const total = await cards(page).count();

    for (const label of ["Online", "New", "Rising", "Popular", "Elite"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(page.getByRole("button", { name: label, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const count = await cards(page).count();
      expect(count).toBeLessThanOrEqual(total);
      // Either results or a well-formed empty state — never a blank screen.
      if (count === 0) await expect(page.getByText("No hosts match")).toBeVisible();
    }

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(cards(page)).toHaveCount(total);

    expect(collector.errors).toEqual([]);
  });

  test("sorting reorders results and keeps the set intact", async ({ page }) => {
    const collector = collectErrors(page);
    await page.goto("/discover");
    await waitForShell(page);

    const sort = page.getByLabel("Sort hosts");
    // Price sorts are the deterministic check: ascending then descending must
    // be exact mirrors of each other.
    await sort.selectOption("price-asc");
    const asc = await cards(page).evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
    await sort.selectOption("price-desc");
    const desc = await cards(page).evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));

    expect(asc.length).toBe(desc.length);
    expect(asc.length).toBeGreaterThan(1);
    expect(new Set(asc)).toEqual(new Set(desc));
    expect(desc).not.toEqual(asc);

    await sort.selectOption("subscribers");
    await expect(cards(page)).toHaveCount(asc.length);
    await sort.selectOption("online");
    await expect(cards(page)).toHaveCount(asc.length);

    expect(collector.errors).toEqual([]);
  });

  test("search and sort compose without resetting each other", async ({ page }) => {
    await page.goto("/discover");
    await waitForShell(page);

    await page.getByLabel("Sort hosts").selectOption("price-desc");
    await page.getByLabel("Search hosts", { exact: true }).fill("a");
    await expect(page.getByLabel("Sort hosts")).toHaveValue("price-desc");

    const count = await cards(page).count();
    await page.getByRole("button", { name: "Online", exact: true }).click();
    expect(await cards(page).count()).toBeLessThanOrEqual(count);
    await expect(page.getByLabel("Search hosts", { exact: true })).toHaveValue("a");
    await expect(page.getByLabel("Sort hosts")).toHaveValue("price-desc");
  });
});

// The empty state is the screen most likely to look broken per-theme: it is the
// only place the gradient CTA sits on a bare page background.
for (const theme of THEMES) {
  test(`discover empty state is legible and on-screen (${theme})`, async ({ page }) => {
    const collector = collectErrors(page);
    await page.goto("/discover");
    await waitForShell(page);
    await setTheme(page, theme);

    await page.getByLabel("Search hosts", { exact: true }).fill("zzzz-no-such-host");

    const empty = page.getByText("No hosts match");
    await expect(empty).toBeVisible();

    const cta = page.getByRole("button", { name: /Clear search & filters/i });
    await expect(cta).toBeVisible();

    const box = await cta.boundingBox();
    expect(box, `empty-state CTA has no box under ${theme}`).not.toBeNull();
    // Must fit the mobile viewport width with no horizontal overflow.
    const width = page.viewportSize()?.width ?? 0;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);

    // Title must not be transparent-on-transparent in any theme.
    const color = await empty.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);

    expect(page.locator("body")).toBeTruthy();
    expect(collector.errors).toEqual([]);
  });
}
