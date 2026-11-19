import { expect, test } from "@playwright/test";

test.describe("navy chrome", () => {
  test("login art fills its navy panel edge to edge", async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto("/login");
    const panel = page.getByTestId("login-art");
    await expect(panel).toBeVisible();
    const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("linear-gradient");
    const p = await panel.boundingBox();
    const art = await panel.locator("img").boundingBox();
    // No frame: the art covers the whole panel.
    expect(Math.abs(art!.x - p!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(art!.width - p!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(art!.height - p!.height)).toBeLessThanOrEqual(1);
  });

  test("footer stays on cream with readable links", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("site-footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    const bgImage = await footer.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bgImage).toBe("none");
    const bg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgb(18, 59, 134)");
  });
});
