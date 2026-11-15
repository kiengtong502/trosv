import { expect, test } from "@playwright/test";

test.describe("navy chrome", () => {
  test("login is one centered card on the same navy band as the home hero", async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.goto("/login");
    const bg = await page
      .getByTestId("auth-page")
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("linear-gradient");
    const card = await page.getByTestId("auth-card").boundingBox();
    expect(card).not.toBeNull();
    // Horizontally centered in the viewport, and no side illustration.
    expect(Math.abs(card!.x + card!.width / 2 - 1360 / 2)).toBeLessThanOrEqual(2);
    await expect(page.getByTestId("login-art")).toHaveCount(0);
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
