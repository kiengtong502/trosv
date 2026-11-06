import { expect, test } from "@playwright/test";
import { LANDLORD, STUDENT, firstConversationId, loginAs } from "./helpers";

const header = (page: import("@playwright/test").Page) =>
    page.locator('[data-testid="plate-band"][data-size="header"]');

test.describe("compact page headers", () => {
    test("student pages show a header band with the page title", async ({ page }) => {
        const { user } = (await loginAs(page, STUDENT)) as { user: { name: string } };
        await page.goto("/favorites");
        await expect(header(page)).toHaveCount(1);
        await expect(header(page).locator("h1")).toContainText("Phòng đã lưu");

        await page.goto("/profile");
        await expect(header(page)).toHaveCount(1);
        await expect(header(page).locator("h1")).toContainText(user.name);
    });

    test("landlord pages show a header band", async ({ page }) => {
        await loginAs(page, LANDLORD);
        await page.goto("/landlord");
        await expect(header(page).locator("h1")).toContainText("Quản lý tin đăng");
        await page.goto("/landlord/new");
        await expect(header(page).locator("h1")).toContainText("Đăng tin mới");
    });

    test("the chat thread has no page band", async ({ page }) => {
        const { token } = await loginAs(page, STUDENT);
        const id = await firstConversationId(page, token);
        test.skip(id === null, "seed data has no conversation for this user");
        await page.goto(`/messages/${id}`);
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator('[data-testid="plate-band"]')).toHaveCount(0);
    });

    test("header bands do not overflow at 375px", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 });
        await loginAs(page, STUDENT);
        for (const path of ["/favorites", "/profile"]) {
            await page.goto(path);
            const band = header(page);
            await expect(band).toHaveCount(1);
            const overflow = await band.evaluate((el) => el.scrollWidth - el.clientWidth);
            expect(overflow, path).toBeLessThanOrEqual(0);
        }
    });

    test("AI pages show a band with a highlighted keyword", async ({ page }) => {
        await loginAs(page, STUDENT);
        for (const path of ["/ai/area-suggestions", "/ai/roommates"]) {
            await page.goto(path);
            await expect(header(page), path).toHaveCount(1);
            await expect(header(page).locator("h1 mark"), path).toBeVisible();
        }
    });

    test("room detail puts the title in a band and the gallery overlaps it", async ({ page }) => {
        const res = await page.request.get("http://localhost:8000/api/listings?per_page=1", {
            headers: { Accept: "application/json" },
        });
        const first = ((await res.json()) as { data: { id: number; title: string }[] }).data[0];
        await page.goto(`/rooms/${first!.id}`);
        const band = header(page);
        await expect(band.locator("h1")).toContainText(first!.title.slice(0, 20));
        const gallery = page.getByRole("button", { name: "Xem ảnh 1" });
        await expect(gallery).toBeVisible();
        const b = await band.boundingBox();
        const g = await gallery.boundingBox();
        expect(g!.y).toBeLessThan(b!.y + b!.height);
    });
});
