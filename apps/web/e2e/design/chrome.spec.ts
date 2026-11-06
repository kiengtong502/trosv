import { expect, test } from "@playwright/test";

test.describe("navy chrome", () => {
    test("login art side is a navy plate that frames the art", async ({ page }) => {
        await page.setViewportSize({ width: 1360, height: 900 });
        await page.goto("/login");
        const panel = page.getByTestId("login-art");
        await expect(panel).toBeVisible();
        const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(bg).toContain("linear-gradient");
        const p = await panel.boundingBox();
        const art = await panel.locator("img").boundingBox();
        // The art is inset from the panel edge so the navy shows around it.
        expect(art!.x).toBeGreaterThan(p!.x + 16);
        expect(art!.width).toBeLessThan(p!.width - 32);
    });

    test("footer uses the band navy and keeps legible links", async ({ page }) => {
        await page.goto("/");
        const footer = page.getByTestId("site-footer");
        await footer.scrollIntoViewIfNeeded();
        await expect(footer).toBeVisible();
        const bg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).toBe("rgb(18, 59, 134)");
        const link = footer.getByRole("link", { name: "Tìm phòng" });
        const lightness = await link.evaluate((el) => {
            // Resolve any CSS colour syntax (oklab, color-mix...) to real pixels.
            const c = document.createElement("canvas").getContext("2d")!;
            c.fillStyle = "#123b86";
            c.fillRect(0, 0, 1, 1);
            c.fillStyle = getComputedStyle(el).color;
            c.fillRect(0, 0, 1, 1);
            const [r = 0, g = 0, b = 0] = c.getImageData(0, 0, 1, 1).data;
            return Math.min(r, g, b);
        });
        // Light text on navy.
        expect(lightness).toBeGreaterThan(170);
    });
});
