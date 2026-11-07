import { expect, test } from "@playwright/test";

test.describe("navy chrome", () => {
  test("login art side is a navy plate that frames the art", async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto("/login");
    const panel = page.getByTestId("login-art");
    await expect(panel).toBeVisible();
    const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("linear-gradient");
    const p = await panel.boundingBox();
    const art = await panel.locator("img").boundingBox();
    // The art is inset from the panel edge so the navy shows around it.
    expect(art!.x).toBeGreaterThan(p!.x + 16);
    expect(art!.width).toBeLessThan(p!.width - 32);
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
