import { expect, test, type Page } from "@playwright/test";

const LISTINGS = "http://localhost:8000/api/listings**";

/** Delays the listings response so loading states can be observed. */
async function delayListings(page: Page, ms: number) {
    await page.route(LISTINGS, async (route) => {
        await new Promise((r) => setTimeout(r, ms));
        await route.continue();
    });
}

test.describe("skeleton and staggered entry", () => {
    test.use({ viewport: { width: 1360, height: 900 } });

    test("search shows card-shaped skeletons that match the real card width", async ({ page }) => {
        await delayListings(page, 1200);
        await page.goto("/rooms");
        const skeleton = page.locator('[data-testid="listing-skeleton"]').first();
        await expect(skeleton).toBeVisible();
        const sk = await skeleton.boundingBox();
        const card = page.locator('[data-testid^="listing-card-"]').first();
        await expect(card).toBeVisible({ timeout: 10_000 });
        const real = await card.boundingBox();
        expect(Math.abs(sk!.width - real!.width)).toBeLessThanOrEqual(2);
        expect(Math.abs(sk!.height - real!.height)).toBeLessThanOrEqual(48);
    });

    test("result cards enter with a staggered fade-up", async ({ page }) => {
        await page.goto("/rooms");
        const grid = page.locator(".motion-stagger").first();
        await expect(grid).toBeVisible();
        const names = await grid.locator('> [data-testid^="listing-card-"]').evaluateAll((els) =>
            els.slice(0, 3).map((el) => getComputedStyle(el).animationName)
        );
        expect(names).toEqual(["fade-up", "fade-up", "fade-up"]);
        const delays = await grid.locator('> [data-testid^="listing-card-"]').evaluateAll((els) =>
            els.slice(0, 3).map((el) => parseFloat(getComputedStyle(el).animationDelay))
        );
        expect(delays[1]!).toBeGreaterThan(delays[0]!);
        expect(delays[2]!).toBeGreaterThan(delays[1]!);
    });

    test("with reduced motion the cards are visible straight away", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/rooms");
        const card = page.locator('[data-testid^="listing-card-"]').first();
        await expect(card).toBeVisible();
        const opacity = await card.evaluate((el) => getComputedStyle(el).opacity);
        expect(opacity).toBe("1");
    });
});
