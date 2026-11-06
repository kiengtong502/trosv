import { expect, test } from "@playwright/test";

test.describe("home hero", () => {
    test.use({ viewport: { width: 1360, height: 900 } });

    test("hero is a navy plate band with the existing headline", async ({ page }) => {
        await page.goto("/");
        const band = page.locator('[data-testid="plate-band"][data-size="hero"]');
        await expect(band).toBeVisible();
        await expect(band.locator("h1")).toContainText("Phòng trọ. Căn hộ.");
        await expect(band.locator("h1 mark")).toHaveText("Gần trường.");
    });

    test("hero art stays inside the viewport and is anchored right", async ({ page }) => {
        await page.goto("/");
        const art = page.locator('[data-testid="plate-band"][data-size="hero"] img[src*="hero-art.svg"]');
        await expect(art).toBeVisible();
        const box = await art.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(1360 + 1);
        const pos = await art.evaluate((el) => getComputedStyle(el).objectPosition);
        expect(pos.startsWith("100%")).toBe(true);
    });

    test("first listing card aligns with the 'Mới đăng' heading", async ({ page }) => {
        await page.goto("/");
        const heading = page.getByRole("heading", { name: "Mới đăng" });
        const firstCard = page.locator('[data-testid^="listing-card-"]').first();
        await expect(firstCard).toBeVisible();
        const h = await heading.boundingBox();
        const c = await firstCard.boundingBox();
        expect(Math.abs(h!.x - c!.x)).toBeLessThanOrEqual(1);
    });
});
