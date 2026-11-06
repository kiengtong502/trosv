import { expect, test, type Page } from "@playwright/test";
import { LANDLORD, STUDENT, loginAs } from "./helpers";

/** Resolves any CSS colour syntax (oklab, color-mix...) to sRGB inside the page. */
async function contrastAgainstNavy(page: Page, selectorFn: () => Promise<string>): Promise<number> {
    return page.evaluate((indicator) => {
        const px = (css: string): [number, number, number] => {
            const c = document.createElement("canvas").getContext("2d")!;
            c.fillStyle = css;
            c.fillRect(0, 0, 1, 1);
            const [r = 0, g = 0, b = 0] = c.getImageData(0, 0, 1, 1).data;
            return [r, g, b];
        };
        const lum = ([r, g, b]: [number, number, number]) => {
            const f = (v: number) => {
                const c = v / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (a: [number, number, number], b: [number, number, number]) => {
            const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
            return (hi + 0.05) / (lo + 0.05);
        };
        const ind = px(indicator);
        return Math.min(ratio(ind, px("#17479e")), ratio(ind, px("#123b86")));
    }, await selectorFn());
}

/** Colour of the visible focus indicator (outline, else the first box-shadow colour). */
async function focusIndicatorColor(target: ReturnType<Page["locator"]>): Promise<string> {
    await target.focus();
    // Let colour transitions settle: measure what a user actually sees.
    await target.evaluate(() => new Promise((resolve) => setTimeout(resolve, 400)));
    return target.evaluate((el) => {
        const s = getComputedStyle(el);
        if (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) return s.outlineColor;
        const m = s.boxShadow.match(/(rgba?|oklab|oklch|color)\([^)]*\)/);
        return m ? m[0] : "rgba(0,0,0,0)";
    });
}

test.describe("review fixes", () => {
    test("room lightbox covers the site header", async ({ page }) => {
        await page.setViewportSize({ width: 1360, height: 900 });
        await page.goto("/rooms/48");
        await page.getByRole("button", { name: "Xem ảnh 1" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const covered = await page.evaluate(() => {
            const top = document.elementFromPoint(300, 20);
            return top?.closest('[role="dialog"]') !== null;
        });
        expect(covered).toBe(true);
    });

    for (const width of [820, 1024, 1280]) {
        test(`home hero text never sits on the art at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto("/");
            const desktopArt = page.locator('img[src*="hero-art.svg"]');
            expect(await desktopArt.evaluate((el) => getComputedStyle(el).display)).toBe("none");
            await expect(page.locator('img[src*="hero-art-mobile.svg"]')).toBeVisible();
        });
    }

    test("home keeps the full-width art on wide screens", async ({ page }) => {
        await page.setViewportSize({ width: 1360, height: 900 });
        await page.goto("/");
        await expect(page.locator('img[src*="hero-art.svg"]')).toBeVisible();
        await expect(page.locator('img[src*="hero-art-mobile.svg"]')).toBeHidden();
    });

    test("focus is visible on navy surfaces (contrast of at least 3:1)", async ({ page }) => {
        await page.setViewportSize({ width: 1360, height: 900 });
        const check = async (target: ReturnType<Page["locator"]>, label: string) => {
            const ratio = await contrastAgainstNavy(page, () => focusIndicatorColor(target));
            expect(ratio, label).toBeGreaterThanOrEqual(3);
        };

        await page.goto("/rooms");
        await check(page.getByLabel("Tìm theo khu vực"), "strip input");
        await check(page.getByRole("button", { name: "Bộ lọc", exact: true }), "filter pill");

        await page.goto("/rooms/48");
        await check(page.getByRole("link", { name: /Quay lại kết quả tìm kiếm/ }), "room back link");

        await loginAs(page, STUDENT);
        await page.goto("/profile");
        await check(page.getByRole("link", { name: /Xem trang cá nhân công khai/ }), "profile action");
    });

    test("focus is visible on the landlord band action", async ({ page }) => {
        await page.setViewportSize({ width: 1360, height: 900 });
        await loginAs(page, LANDLORD);
        await page.goto("/landlord");
        const link = page.getByRole("link", { name: "Đăng tin mới" });
        const color = await focusIndicatorColor(link);
        const ratio = await contrastAgainstNavy(page, async () => color);
        expect(ratio).toBeGreaterThanOrEqual(3);
    });

    test("browser Back returns to the previous scroll position", async ({ page }) => {
        await page.setViewportSize({ width: 1360, height: 900 });
        await page.goto("/rooms");
        const cards = page.locator('[data-testid^="listing-card-"]');
        await expect(cards.nth(5)).toBeVisible();
        await page.evaluate(() => window.scrollTo(0, 700));
        const before = await page.evaluate(() => window.scrollY);
        expect(before).toBeGreaterThan(300);
        await cards.nth(4).click();
        await expect(page).toHaveURL(/\/rooms\/\d+/);
        await page.goBack();
        await expect(page).toHaveURL(/\/rooms$/);
        await expect(cards.nth(5)).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(before - 150);
    });
});
