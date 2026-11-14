import { expect, test } from "@playwright/test";

/**
 * Regression guard: schools can be selected by city without choosing a ward.
 * Selecting a ward narrows the list using school.ward.id from the API;
 * changing the ward resets the school and radius.
 *
 * Assert phần lọc ở LỚP API (response /listings) - không assert theo text
 * card vì seeder bóc tên phường vào title, text-assert sẽ pass ảo.
 */
test.describe("rooms ward -> school cascade", () => {
  test("mobile keeps TP.HCM fixed and includes the two outside campus references", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/rooms");
    await page.getByRole("button", { name: "Gần trường", exact: true }).click();
    await expect(page.locator("#near-school-city")).toHaveValue("TP.HCM");
    await expect(page.locator("#near-school-ward option")).toHaveCount(103);
    await expect(page.locator("#filter-school")).toBeEnabled();
    await expect(page.locator("#filter-school option")).toHaveCount(62);
    for (const name of ["ĐH Quốc tế", "ĐH Khoa học Sức khỏe"]) {
      await expect(
        page.locator("#filter-school").getByRole("option", { name, exact: true }),
      ).toHaveCount(1);
    }
  });

  test("school list narrows to the chosen ward and resets on ward change", async ({ page }) => {
    await page.goto("/rooms");

    // City + ward cascade lives in the "Bộ lọc" pill popover.
    await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
    const citySelect = page.locator("#filter-city");
    const wardSelect = page.locator("#filter-ward");

    await expect(citySelect).toHaveValue("TP.HCM");
    await expect(citySelect).toHaveAttribute("readonly");
    await expect(wardSelect).toBeEnabled();
    await expect(wardSelect.locator("option")).toHaveCount(103);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Gần trường", exact: true }).click();
    await expect(page.locator("#filter-school")).toBeEnabled();
    await expect(page.locator("#filter-school option")).toHaveCount(62);
    await expect(
      page.locator("#filter-school").getByRole("option", { name: "ĐH Quốc tế", exact: true }),
    ).toHaveCount(1);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();

    // Chợ Quán hosts three schools in the updated catalog.
    await wardSelect.selectOption({ label: "Phường Chợ Quán" });
    await page.keyboard.press("Escape");

    // The "Gần trường" pill narrows schools to exactly that ward.
    await page.getByRole("button", { name: "Gần trường", exact: true }).click();
    const schoolSelect = page.locator("#filter-school");
    await expect(schoolSelect.locator("option")).toHaveCount(4); // placeholder + 3
    for (const name of ["ĐH Khoa học Tự nhiên", "ĐH Sư phạm TP.HCM", "ĐH Sài Gòn"]) {
      await expect(schoolSelect.locator(`option:has-text("${name}")`)).toHaveCount(1);
    }
    await expect(schoolSelect.locator('option:has-text("ĐH Bách khoa")')).toHaveCount(0); // khác phường -> biến mất

    // Placeholder mirrors the cascade state (React controlled select:
    // assert qua value + text, khong qua attribute [selected]).
    await expect(schoolSelect).toHaveValue("");
    await expect(schoolSelect).toContainText("Chọn trường trong phường này");

    // Choosing a school in that ward refetches with school_id set (the
    // hook keeps ward_id too); every returned listing belongs to the
    // school's ward.
    const listingsWithWard = page.waitForResponse(
      (r) => r.url().includes("/listings") && r.url().includes("school_id="),
    );
    const schoolVal = await schoolSelect
      .locator('option:has-text("ĐH Khoa học Tự nhiên")')
      .getAttribute("value");
    await schoolSelect.selectOption(schoolVal);
    const res = await listingsWithWard;
    const url = new URL(res.url());
    expect(url.searchParams.get("school_id")).toBeTruthy();
    const body = (await res.json()) as {
      data: Array<{ ward: { id: number; name: string } }>;
    };
    const wardId = url.searchParams.get("ward_id");
    for (const listing of body.data) {
      expect(String(listing.ward.id)).toBe(wardId);
    }

    // Radius select appears only after a school is chosen.
    await expect(page.locator("#filter-radius")).toBeVisible();
    await page.keyboard.press("Escape");

    // Changing the ward resets school + radius (cascade hygiene).
    await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
    await wardSelect.selectOption({ label: "Phường Diên Hồng" });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Gần trường", exact: true }).click();
    await expect(schoolSelect).toHaveValue("");
    for (const name of ["ĐH Bách khoa"]) {
      await expect(schoolSelect.locator(`option:has-text("${name}")`)).toHaveCount(1);
    }
    await expect(schoolSelect.locator('option:has-text("ĐH Khoa học Tự nhiên")')).toHaveCount(0);
    await page.keyboard.press("Escape");

    // Reset keeps TP.HCM fixed and makes all supported wards available.
    await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
    await page.getByRole("button", { name: "Đặt lại" }).click();
    await expect(wardSelect).toBeEnabled();
    await expect(wardSelect).toHaveValue("");
    await expect(wardSelect.locator("option")).toHaveCount(103);
  });
});
