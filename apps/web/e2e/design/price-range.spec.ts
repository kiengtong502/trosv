import { expect, test } from "@playwright/test";
import { STUDENT, loginAs } from "./helpers";

test.describe("price range slider", () => {
    test.use({ viewport: { width: 1200, height: 800 } });

    test("search: one bar with two dots, 100.000đ steps, no number boxes", async ({ page }) => {
        await page.goto("/rooms");
        await page.getByRole("button", { name: /^Giá/ }).click();
        await expect(page.getByRole("slider")).toHaveCount(2);
        await expect(page.locator('input[type="number"]')).toHaveCount(0);
        await expect(page.getByRole("slider", { name: "Giá tối thiểu" })).toHaveAttribute("step", "100000");
        await expect(page.getByTestId("filter-price-readout")).toHaveText("Không giới hạn");
    });

    test("search: moving the dots narrows the range and the URL follows", async ({ page }) => {
        await page.goto("/rooms");
        await page.getByRole("button", { name: /^Giá/ }).click();
        const max = page.getByRole("slider", { name: "Giá tối đa" });
        await max.focus();
        for (let i = 0; i < 70; i++) await page.keyboard.press("ArrowLeft"); // 10tr -> 3tr
        const min = page.getByRole("slider", { name: "Giá tối thiểu" });
        await min.focus();
        for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowRight"); // 0 -> 1,5tr
        await expect(page.getByTestId("filter-price-readout")).toHaveText("1.500.000đ – 3.000.000đ");
        await expect(page).toHaveURL(/price_min=1500000/, { timeout: 10_000 });
        await expect(page).toHaveURL(/price_max=3000000/);
    });

    test("the dots never cross: they stay one step apart", async ({ page }) => {
        await page.goto("/rooms?price_min=2000000&price_max=2500000");
        await page.getByRole("button", { name: /^Giá/ }).click();
        const min = page.getByRole("slider", { name: "Giá tối thiểu" });
        await min.focus();
        for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");
        await expect(page).toHaveURL(/price_min=2400000/, { timeout: 10_000 });
        await expect(page).toHaveURL(/price_max=2500000/);
    });

    test("prices are shown exactly, never rounded to tr", async ({ page }) => {
        await page.goto("/rooms?price_min=1250000&price_max=3700000");
        await expect(page.getByText("1.250.000đ – 3.700.000đ").first()).toBeVisible();
        await page.getByRole("button", { name: /^Giá/ }).click();
        await expect(page.getByTestId("filter-price-readout")).toHaveText("1.250.000đ – 3.700.000đ");
    });

    test("a saved range loads onto the bar", async ({ page }) => {
        await page.goto("/rooms?price_min=1000000&price_max=4000000");
        await page.getByRole("button", { name: /^Giá/ }).click();
        await expect(page.getByTestId("filter-price-readout")).toHaveText("1.000.000đ – 4.000.000đ");
    });

    test("AI area suggestions budget uses the same bar", async ({ page }) => {
        await loginAs(page, STUDENT);
        await page.goto("/ai/area-suggestions");
        await expect(page.getByRole("slider")).toHaveCount(2);
        await expect(page.locator('input[type="number"]')).toHaveCount(0);
    });
});
