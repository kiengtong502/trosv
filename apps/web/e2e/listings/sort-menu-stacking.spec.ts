import { expect, test } from "@playwright/test";

// The sort menu is portalled above the page; if it stayed open while the page scrolled it
// would float over the sticky header and filter bar. It closes on scroll instead.
test("an open sort menu closes when the page scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 700 });
  await page.goto("/rooms");
  await page.waitForSelector('[data-testid^="listing-card-"]');
  await page
    .getByRole("button", { name: /Mới nhất/ })
    .first()
    .click();
  const menu = page.getByRole("button", { name: "Giá thấp trước" });
  await expect(menu).toBeVisible();

  await page.mouse.wheel(0, 150);
  await expect(menu).toBeHidden();
});

test("the sort menu still changes the order", async ({ page }) => {
  await page.goto("/rooms");
  await page.waitForSelector('[data-testid^="listing-card-"]');
  await page
    .getByRole("button", { name: /Mới nhất/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Giá thấp trước" }).click();
  await expect(page).toHaveURL(/sort=price_asc/);
});

test("Escape closes the sort menu and gives focus back to its button", async ({ page }) => {
  await page.goto("/rooms");
  await page.waitForSelector('[data-testid^="listing-card-"]');
  const trigger = page.getByRole("button", { name: /Mới nhất/ }).first();
  await trigger.click();
  await expect(page.getByRole("button", { name: "Giá thấp trước" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Giá thấp trước" })).toBeHidden();
  await expect(trigger).toBeFocused();
});
