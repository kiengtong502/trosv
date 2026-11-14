import { expect, test, type Page } from "@playwright/test";
import { LANDLORD, loginAs } from "./helpers";

// Read-only: these specs never press "Đăng tin", so they never write to the demo database.

/** Chooses `count` tiny images in the file input, the way the browser would. */
async function pickPhotos(page: Page, count: number): Promise<void> {
  await page.locator('input[type="file"]').evaluate((input: HTMLInputElement, n: number) => {
    const files = new DataTransfer();
    for (let i = 0; i < n; i++) {
      files.items.add(new File(["x"], `photo-${String(i)}.png`, { type: "image/png" }));
    }
    input.files = files.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, count);
}

test.describe("landlord listing form", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, LANDLORD);
    await page.goto("/landlord/new");
    await expect(page.getByRole("heading", { level: 1, name: "Đăng tin mới" })).toBeVisible();
  });

  test("TP.HCM is fixed and its 102 wards are immediately available", async ({ page }) => {
    const ward = page.locator("#lf-ward");
    await expect(ward).toBeEnabled();

    const city = page.locator("#lf-city");
    await expect(city).toHaveValue("TP.HCM");
    await expect(city).toHaveAttribute("readonly");
    await expect(ward.locator("option")).toHaveCount(103);

    await ward.selectOption({ index: 1 });
    await expect(ward).not.toHaveValue("");

    await page.locator("#lf-street").fill("12 Đường số 5");
    await expect(page.locator("#lf-address")).toHaveValue(/12 Đường số 5, .+, TP.HCM/);
  });

  test("an amenity chip toggles on and off", async ({ page }) => {
    const chip = page
      .locator("fieldset")
      .filter({ hasText: "Tiện ích" })
      .getByRole("button")
      .first();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking the map fills latitude and longitude", async ({ page }) => {
    const picker = page.getByTestId("coordinate-picker");
    await picker.scrollIntoViewIfNeeded();
    await expect(picker.locator(".leaflet-container")).toBeVisible();
    await picker.locator(".leaflet-container").click({ position: { x: 120, y: 90 } });

    await expect(page.locator("#lf-lat")).not.toHaveValue("");
    await expect(page.locator("#lf-lng")).not.toHaveValue("");
    await expect(picker.locator(".leaflet-overlay-pane path.leaflet-interactive")).toHaveCount(1);
  });

  test("typing in other fields does not reset the map you already picked on", async ({ page }) => {
    const picker = page.getByTestId("coordinate-picker");
    await picker.scrollIntoViewIfNeeded();
    await picker.locator(".leaflet-container").click({ position: { x: 120, y: 90 } });
    await expect(picker.locator(".leaflet-overlay-pane path.leaflet-interactive")).toHaveCount(1);
    const lat = await page.locator("#lf-lat").inputValue();

    await page.locator("#lf-title").fill("Phòng thử nghiệm");
    await page.locator("#lf-street").fill("12 Đường số 5");

    await expect(picker.locator(".leaflet-overlay-pane path.leaflet-interactive")).toHaveCount(1);
    await expect(page.locator("#lf-lat")).toHaveValue(lat);
  });

  test("picking photos reports the count, and more than 5 is refused", async ({ page }) => {
    await pickPhotos(page, 2);
    await expect(page.getByText("Đã chọn 2 ảnh")).toBeVisible();

    await pickPhotos(page, 6);
    await expect(page.getByRole("alert")).toContainText("Tối đa 5 ảnh mỗi tin.");
  });

  test("editing shows the status select and the existing photos", async ({ page, request }) => {
    const { token } = (await loginAs(page, LANDLORD)) as { token: string };
    const res = await request.get("http://localhost:8000/api/my/listings", {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    const first = ((await res.json()) as { data: { id: number; title: string }[] }).data[0];
    test.skip(first === undefined, "the seeded landlord has no listing");

    await page.goto(`/landlord/edit/${String(first?.id)}`);
    await expect(page.getByRole("heading", { level: 1, name: "Sửa tin đăng" })).toBeVisible();
    await expect(page.locator("#lf-title")).toHaveValue(first?.title ?? "");
    await expect(page.locator("#lf-status")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ảnh tin đăng" })).toBeVisible();
  });
});
