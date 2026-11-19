import { expect, test } from "@playwright/test";

test("desktop: the map can be hidden and shown again; a type filter keeps it", async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto("/rooms?type=apartment");
  const map = page.getByTestId("map-pane");
  await expect(map).toBeVisible();

  await page.getByRole("button", { name: "Ẩn bản đồ" }).click();
  await expect(map).toHaveCount(0);

  await page.getByRole("button", { name: "Hiện bản đồ" }).click();
  await expect(map).toBeVisible();
});
