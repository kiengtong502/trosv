import { expect, test, type Page } from "@playwright/test";
import { STUDENT, loginAs } from "./helpers";

const KEYS = [
    "cat", "plant", "house", "book", "coffee", "moon",
    "robot", "cloud", "sun", "backpack", "headphones", "mushroom",
];

/** The profile save is mocked so the demo database keeps its avatars. */
async function openProfileWithMockedSave(page: Page) {
    const { user } = await loginAs(page, STUDENT);
    let me = { ...(user as Record<string, unknown>) };
    const sent: Record<string, unknown>[] = [];
    await page.route("**/api/profile", async (route) => {
        if (route.request().method() !== "PUT") return route.fallback();
        const body = route.request().postDataJSON() as Record<string, unknown>;
        sent.push(body);
        me = { ...me, ...body };
        await route.fulfill({ json: { data: me } });
    });
    await page.route("**/api/me", (route) => route.fulfill({ json: { data: me } }));
    await page.goto("/profile");
    await expect(page.getByTestId("page-header")).toBeVisible();
    return { sent, current: () => me.avatar as string };
}

test.describe("avatars", () => {
    test.use({ viewport: { width: 1360, height: 900 } });

    test("the profile header shows the user's hand-drawn avatar, not initials", async ({ page }) => {
        const { current } = await openProfileWithMockedSave(page);
        const avatar = page.getByTestId("page-header").locator("[data-avatar]");
        await expect(avatar).toHaveAttribute("data-avatar", current());
        await expect(avatar.locator("svg")).toBeVisible();
    });

    test("the change-picture dialog offers all 12 avatars", async ({ page }) => {
        await openProfileWithMockedSave(page);
        await page.getByRole("button", { name: "Đổi ảnh đại diện" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("radio")).toHaveCount(12);
        for (const key of KEYS) {
            await expect(dialog.getByRole("radio").locator(`[data-avatar="${key}"]`)).toHaveCount(1);
        }
    });

    test("picking one and saving updates the header and sends the key", async ({ page }) => {
        const { sent, current } = await openProfileWithMockedSave(page);
        const target = current() === "robot" ? "sun" : "robot";
        await page.getByRole("button", { name: "Đổi ảnh đại diện" }).click();
        await page.getByRole("dialog").locator(`[data-avatar="${target}"]`).click();
        await page.getByRole("dialog").getByRole("button", { name: "Lưu ảnh" }).click();
        await expect(page.getByRole("dialog")).toBeHidden();
        expect(sent).toEqual([{ avatar: target }]);
        await expect(page.getByTestId("page-header").locator("[data-avatar]")).toHaveAttribute(
            "data-avatar",
            target,
        );
    });

    test("the random button picks a different avatar", async ({ page }) => {
        const { current } = await openProfileWithMockedSave(page);
        await page.getByRole("button", { name: "Đổi ảnh đại diện" }).click();
        const dialog = page.getByRole("dialog");
        const before = current();
        await dialog.getByRole("button", { name: "Ngẫu nhiên" }).click();
        const selected = dialog.getByRole("radio", { checked: true }).locator("[data-avatar]");
        const key = await selected.getAttribute("data-avatar");
        expect(KEYS).toContain(key);
        expect(key).not.toBe(before);
    });

    test("closing without saving leaves the avatar alone", async ({ page }) => {
        const { sent, current } = await openProfileWithMockedSave(page);
        const before = current();
        await page.getByRole("button", { name: "Đổi ảnh đại diện" }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Ngẫu nhiên" }).click();
        await page.keyboard.press("Escape");
        expect(sent).toEqual([]);
        await expect(page.getByTestId("page-header").locator("[data-avatar]")).toHaveAttribute("data-avatar", before);
    });

    test("other people show their avatar in the messages list", async ({ page }) => {
        await loginAs(page, STUDENT);
        await page.goto("/messages");
        const item = page.locator('a[data-testid^="conversation-"]').first();
        await expect(item).toBeVisible();
        await expect(item.locator("[data-avatar]")).toHaveCount(1);
    });
});
