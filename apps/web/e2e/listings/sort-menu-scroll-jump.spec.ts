import { expect, test } from "@playwright/test";

// Closing the sort menu must not pull the page back to the sort button (Radix hands focus
// back to the trigger on close, and the browser scrolls it into view).
test("scrolling fast with the sort menu open keeps the page where the user scrolled to", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1360, height: 700 });
  await page.goto("/rooms");
  await page.waitForSelector('[data-testid^="listing-card-"]');
  await page
    .getByRole("button", { name: /Mới nhất/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Giá thấp trước" })).toBeVisible();

  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 140);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(600);

  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(600);
});
