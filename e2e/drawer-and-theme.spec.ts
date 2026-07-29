import { test, expect } from "@playwright/test";
import { THEMES, collectErrors, interactiveElements, setTheme, waitForShell } from "./helpers";

const DRAWER = 'aside[aria-label="Main menu"]';

for (const theme of THEMES) {
  test(`drawer opens, navigates and closes cleanly (${theme})`, async ({ page }) => {
    const collector = collectErrors(page);
    await setTheme(page, theme);
    await page.goto("/");
    await waitForShell(page);

    const drawer = page.locator(DRAWER);

    // CLOSED: must be inert — no stray taps, no keyboard focus traps.
    await expect(drawer).toHaveAttribute("aria-hidden", "true");
    const closedReachable = (await interactiveElements(page)).filter(
      (el) => el.inertHidden === false && el.label === "Close menu",
    );
    expect(closedReachable, "closed drawer must not expose reachable controls").toEqual([]);

    // OPEN
    await page.getByLabel("Open menu").click({ force: true });
    await expect(drawer).toHaveAttribute("aria-hidden", "false");
    await expect(page.getByRole("button", { name: /Find people/i })).toBeVisible();

    // Drawer rows must be readable in this theme (no invisible text).
    const contrastIssues = await page.evaluate((sel) => {
      const problems: string[] = [];
      const root = document.querySelector(sel);
      if (!root) return ["drawer missing"];
      for (const el of Array.from(root.querySelectorAll("span, p, h3"))) {
        const text = (el as HTMLElement).innerText?.trim();
        if (!text || text.length < 2) continue;
        const style = getComputedStyle(el);
        if (style.opacity === "0" || style.visibility === "hidden") problems.push(text.slice(0, 30));
      }
      return problems;
    }, DRAWER);
    expect(contrastIssues, `hidden drawer text under ${theme}`).toEqual([]);

    // People discovery opens from inside the drawer, and Escape closes only
    // that top layer — the drawer must stay open beneath it.
    await page.getByRole("button", { name: /Find people/i }).click({ force: true });
    await expect(page.getByRole("dialog", { name: "Find people" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Find people" })).toHaveCount(0);
    await expect(drawer).toHaveAttribute("aria-hidden", "false");

    // A drawer link navigates and the drawer closes behind it.
    await page.getByRole("link", { name: /Policies & legal/i }).click({ force: true });
    await page.waitForURL("**/legal", { timeout: 15_000 });
    await expect(drawer).toHaveAttribute("aria-hidden", "true");


    // CLOSE via the X button.
    await page.getByLabel("Open menu").click({ force: true });
    await page.getByLabel("Close menu").click({ force: true });
    await expect(drawer).toHaveAttribute("aria-hidden", "true");

    // CLOSE via Escape.
    await page.getByLabel("Open menu").click({ force: true });
    await expect(drawer).toHaveAttribute("aria-hidden", "false");
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("aria-hidden", "true");

    // Body scroll lock must be released after closing.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    expect(collector.errors, `errors during drawer flow under ${theme}`).toEqual([]);
  });
}

test("theme toggle switches every theme and persists across reloads", async ({ page }) => {
  const collector = collectErrors(page);
  await page.goto("/");
  await waitForShell(page);

  // Primary toggles (Pink + Sea live directly in the header).
  for (const [name, cls] of [
    ["Pink", "theme-pink"],
    ["Sea", "theme-abyss"],
  ] as const) {
    await page.getByRole("button", { name, exact: true }).first().click({ force: true });
    await expect(page.locator("html")).toHaveClass(new RegExp(`${cls}\\b`));
  }

  // Extra themes live behind the dropdown, which is portaled to <body>.
  for (const [label, cls] of [
    ["Blue", "theme-blue"],
    ["Ocean", "theme-ocean"],
    ["Rose", "theme-rose"],
    ["Romance", "theme-romance"],
  ] as const) {
    await page.getByRole("button", { name: /More themes/i }).first().click({ force: true });
    const item = page.getByRole("menuitemradio", { name: label, exact: true });
    await expect(item).toBeVisible();
    await item.click({ force: true });
    await expect(page.locator("html")).toHaveClass(new RegExp(`${cls}\\b`));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(new RegExp(`${cls}\\b`));
  }


  expect(collector.errors).toEqual([]);
});
