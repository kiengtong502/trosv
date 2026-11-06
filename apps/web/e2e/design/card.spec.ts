import { expect, test } from "@playwright/test";

test.describe("listing card hierarchy", () => {
    test.use({ viewport: { width: 1360, height: 900 } });

    test("title is bold and large, address is small and quiet", async ({ page }) => {
        await page.goto("/rooms");
        const card = page.locator('[data-testid^="listing-card-"]').first();
        await expect(card).toBeVisible();
        const title = card.locator("h3");
        const t = await title.evaluate((el) => {
            const s = getComputedStyle(el);
            return { weight: Number(s.fontWeight), size: parseFloat(s.fontSize) };
        });
        expect(t.weight).toBeGreaterThanOrEqual(700);
        expect(t.size).toBeGreaterThanOrEqual(16);
        const addr = card.locator("span.line-clamp-1");
        const size = await addr.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(size).toBeLessThanOrEqual(13);
    });

    test("card rests with a soft shadow and lifts 4px on hover", async ({ page }) => {
        await page.goto("/rooms");
        const card = page.locator('[data-testid^="listing-card-"]').first();
        await expect(card).toBeVisible();
        const resting = await card.evaluate((el) => getComputedStyle(el).boxShadow);
        expect(resting).not.toBe("none");
        await card.hover();
        await page.waitForTimeout(400);
        const lifted = await card.evaluate((el) => getComputedStyle(el).transform);
        expect(lifted).toBe("matrix(1, 0, 0, 1, 0, -4)");
    });

    test("cards in one grid row keep equal height", async ({ page }) => {
        await page.goto("/rooms");
        const cards = page.locator('[data-testid^="listing-card-"]');
        await expect(cards.nth(1)).toBeVisible();
        const a = await cards.nth(0).boundingBox();
        const b = await cards.nth(1).boundingBox();
        expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
        expect(Math.abs(a!.height - b!.height)).toBeLessThan(2);
    });

    test("clicking blank space on the card opens the room; the heart does not", async ({ page }) => {
        await page.goto("/rooms");
        const card = page.locator('[data-testid^="listing-card-"]').first();
        await expect(card).toBeVisible();
        const box = (await card.boundingBox())!;
        // Lower-middle of the card: padding between the address and the rating row.
        await page.mouse.click(box.x + box.width * 0.5, box.y + box.height - 8);
        await expect(page).toHaveURL(/\/rooms\/\d+/);
    });

    test("tapping the heart as a guest stays on the list", async ({ page }) => {
        await page.goto("/rooms");
        const card = page.locator('[data-testid^="listing-card-"]').first();
        await expect(card).toBeVisible();
        await card.getByRole("button", { name: /Lưu phòng/ }).click();
        await expect(page).not.toHaveURL(/\/rooms\/\d+/);
    });
});
