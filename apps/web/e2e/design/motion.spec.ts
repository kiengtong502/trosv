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

test.describe("route fade, image fade-in, scroll reveal", () => {
    test.use({ viewport: { width: 1360, height: 900 } });

    test("navigating resets scroll and fades the new page in", async ({ page }) => {
        await page.goto("/");
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.getByRole("link", { name: /Xem tất cả phòng/ }).click();
        await expect(page).toHaveURL(/\/rooms$/);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
        const wrapper = page.getByTestId("route-fade");
        await expect(wrapper).toBeVisible();
        expect(await wrapper.evaluate((el) => getComputedStyle(el).animationName)).toBe("fade-in");
    });

    test("a card image shows once loaded and stays visible when it fails", async ({ page }) => {
        await page.route("**/storage/**", (route) => route.abort());
        await page.goto("/rooms");
        const img = page.locator('[data-testid^="listing-card-"] img').first();
        await expect(img).toBeAttached();
        await expect(img).toHaveCSS("opacity", "1", { timeout: 5000 });
    });

    test("a listing without a cover image still renders a full card", async ({ page }) => {
        await page.route(LISTINGS, (route) =>
            route.fulfill({
                contentType: "application/json",
                body: JSON.stringify({
                    data: [
                        {
                            id: 901,
                            landlord_id: 1,
                            title: "Phòng không ảnh",
                            price: 2000000,
                            address: "1 Đường A",
                            cover_image: null,
                        },
                    ],
                    meta: { current_page: 1, last_page: 1, per_page: 8, total: 1 },
                }),
            })
        );
        await page.goto("/rooms");
        const card = page.getByTestId("listing-card-901");
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        expect(box!.height).toBeGreaterThan(200);
    });

    test("home sections reveal on scroll", async ({ page }) => {
        await page.goto("/");
        const section = page.locator("section", { has: page.getByRole("heading", { name: "Mới đăng" }) });
        await section.scrollIntoViewIfNeeded();
        await expect(section).toHaveAttribute("data-reveal", "done");
    });

    test("sections still appear if IntersectionObserver never fires", async ({ page }) => {
        await page.addInitScript(() => {
            class Dead {
                observe() {}
                unobserve() {}
                disconnect() {}
                takeRecords() {
                    return [];
                }
            }
            (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = Dead;
        });
        await page.goto("/");
        const section = page.locator("section", { has: page.getByRole("heading", { name: "Mới đăng" }) });
        await expect(section).toHaveCSS("opacity", "1", { timeout: 6000 });
    });

    test("with reduced motion nothing is held back", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/");
        const section = page.locator("section", { has: page.getByRole("heading", { name: "Mới đăng" }) });
        await expect(section).toHaveCSS("opacity", "1");
    });
});
