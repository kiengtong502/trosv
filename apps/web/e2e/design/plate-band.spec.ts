import { expect, test, type Page } from "@playwright/test";
import { LANDLORD, STUDENT, firstConversationId, loginAs } from "./helpers";

const band = (page: Page) => page.locator('[data-testid="plate-band"]');
const header = (page: Page) => page.locator('[data-testid="page-header"]');

test.describe("navy band is reserved for three places", () => {
    test("Home hero and the Search strip keep the band", async ({ page }) => {
        await page.goto("/");
        await expect(band(page)).toHaveCount(1);
        await expect(band(page)).toHaveAttribute("data-size", "hero");
        await page.goto("/rooms");
        await expect(band(page)).toHaveCount(1);
        await expect(band(page)).toHaveAttribute("data-size", "strip");
    });

    test("student pages use a plain page header, no band", async ({ page }) => {
        const { user } = (await loginAs(page, STUDENT)) as { user: { name: string } };
        await page.goto("/favorites");
        await expect(band(page)).toHaveCount(0);
        await expect(header(page).locator("h1")).toContainText("Phòng đã lưu");
        await page.goto("/profile");
        await expect(band(page)).toHaveCount(0);
        await expect(header(page).locator("h1")).toContainText(user.name);
        for (const path of ["/ai/area-suggestions", "/ai/roommates"]) {
            await page.goto(path);
            await expect(band(page), path).toHaveCount(0);
            await expect(header(page).locator("h1 mark"), path).toBeVisible();
        }
    });

    test("landlord pages use a plain page header, no band", async ({ page }) => {
        await loginAs(page, LANDLORD);
        await page.goto("/landlord");
        await expect(band(page)).toHaveCount(0);
        await expect(header(page).locator("h1")).toContainText("Quản lý tin đăng");
        await page.goto("/landlord/new");
        await expect(band(page)).toHaveCount(0);
        await expect(header(page).locator("h1")).toContainText("Đăng tin mới");
    });

    test("room detail has the title on cream, with no band", async ({ page }) => {
        const res = await page.request.get("http://localhost:8000/api/listings?per_page=1", {
            headers: { Accept: "application/json" },
        });
        const first = ((await res.json()) as { data: { id: number; title: string }[] }).data[0];
        await page.goto(`/rooms/${first!.id}`);
        await expect(page.locator("main h1")).toContainText(first!.title.slice(0, 20));
        await expect(band(page)).toHaveCount(0);
    });

    test("chat has no band and a cream conversation header", async ({ page }) => {
        const { token } = await loginAs(page, STUDENT);
        const id = await firstConversationId(page, token);
        test.skip(id === null, "seed data has no conversation for this user");
        await page.goto(`/messages/${id}`);
        await expect(page.locator("main")).toBeVisible();
        await expect(band(page)).toHaveCount(0);
        const bg = await page
            .locator('[data-testid="thread"]')
            .locator("xpath=preceding-sibling::div[1]")
            .evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(bg).toBe("none");
    });

    test("page headers do not overflow at 375px", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 });
        await loginAs(page, STUDENT);
        for (const path of ["/favorites", "/profile"]) {
            await page.goto(path);
            const h = header(page);
            await expect(h).toHaveCount(1);
            const overflow = await h.evaluate((el) => el.scrollWidth - el.clientWidth);
            expect(overflow, path).toBeLessThanOrEqual(0);
        }
    });
});
