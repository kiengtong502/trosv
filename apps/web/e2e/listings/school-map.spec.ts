import { expect, test } from "@playwright/test";

interface School {
  id: number;
  name: string;
  campus_name: string;
  address: string;
}

test("selected school has a separate pin, campus popup and optional radius", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/schools");
  expect(response.ok()).toBe(true);
  const { data } = (await response.json()) as { data: School[] };
  const school = data.find((item) => item.name === "ĐH Bách khoa")!;
  expect(school.address).toContain("268 Lý Thường Kiệt");

  await page.goto("/rooms");
  await expect(page.locator(".trosv-school-marker")).toHaveCount(0);
  await page.getByRole("button", { name: "Gần trường", exact: true }).click();
  await page.locator("#filter-school").selectOption(String(school.id));
  await page.keyboard.press("Escape");
  const marker = page.locator(".trosv-school-marker");
  await expect(marker).toHaveCount(1);
  await expect(marker).toBeVisible();
  await expect(page.locator(".trosv-school-label")).toHaveText(school.name);
  const labelBox = await page.locator(".trosv-school-label").boundingBox();
  expect(labelBox!.width).toBeGreaterThan(labelBox!.height * 2);
  await expect(page.locator(".trosv-school-radius")).toHaveCount(0);
  await marker.click();
  const popup = page.locator(".trosv-school-popup");
  await expect(popup).toContainText(school.campus_name);
  await expect(popup).toContainText(school.address);

  await page.getByRole("button", { name: "Gần trường", exact: true }).click();
  await page.locator("#filter-radius").selectOption("2");
  await page.keyboard.press("Escape");
  await expect(page.locator(".trosv-school-radius")).toHaveCount(1);
  await expect(page.getByTestId("school-map-legend")).toBeInViewport();
  await expect(page.getByTestId("school-map-legend")).toContainText(
    "Bán kính 2 km · đường chim bay",
  );
  await page.getByRole("button", { name: "Gần trường", exact: true }).click();
  await page.getByRole("button", { name: "Xóa lọc này", exact: true }).click();
  await expect(marker).toHaveCount(0);
  await expect(page.locator(".trosv-school-radius")).toHaveCount(0);
  await expect(page.getByTestId("school-map-legend")).toHaveCount(0);
});

test("mobile shows and switches Đông Hòa references even with no matching rooms", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await request.get("/api/schools");
  const { data } = (await response.json()) as { data: School[] };
  const first = data.find((school) => school.name === "ĐH Quốc tế")!;
  const second = data.find((school) => school.name === "ĐH Khoa học Sức khỏe")!;
  await page.route("**/api/listings?**", (route) =>
    route.fulfill({
      json: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1, per_page: 12 },
      },
    }),
  );
  await page.goto(`/rooms?school_id=${String(first.id)}&max_km=2`);
  await page.getByRole("button", { name: "Xem bản đồ", exact: true }).last().click();
  const map = page.getByTestId("map-pane");
  await expect(map).toBeVisible();
  const marker = page.locator(".trosv-school-marker");
  await expect(marker).toBeVisible();
  await expect(page.locator(".trosv-school-label")).toHaveText(first.name);
  await expect(page.locator(".trosv-school-radius")).toHaveCount(1);
  const mapBox = await map.boundingBox();
  const pinBox = await marker.boundingBox();
  expect(pinBox!.x + pinBox!.width / 2).toBeGreaterThan(mapBox!.x);
  expect(pinBox!.x + pinBox!.width / 2).toBeLessThan(mapBox!.x + mapBox!.width);
  expect(pinBox!.y + pinBox!.height / 2).toBeGreaterThan(mapBox!.y);
  expect(pinBox!.y + pinBox!.height / 2).toBeLessThan(mapBox!.y + mapBox!.height);
  await marker.click();
  await expect(page.locator(".trosv-school-popup")).toContainText(first.address);
  await page.getByRole("button", { name: "Gần trường", exact: true }).click();
  await page.locator("#filter-school").selectOption(String(second.id));
  await page.keyboard.press("Escape");
  await expect(marker).toHaveCount(1);
  await expect(page.locator(".trosv-school-label")).toHaveCount(1);
  await expect(page.locator(".trosv-school-label")).toHaveText(second.name);
});
