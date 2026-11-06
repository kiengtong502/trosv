import { expect, test, type Page } from "@playwright/test";
import { STUDENT, loginAs } from "./helpers";

/* The picker is edited in place and never saved here, so the demo DB is untouched. */
async function openProfile(page: Page) {
    await loginAs(page, STUDENT);
    await page.goto("/profile");
    // The picker lives in a dialog opened from the "Ghép bạn cùng phòng" section.
    await page.getByRole("button", { name: /Ghép bạn cùng phòng/ }).click();
    await page.getByRole("button", { name: "Sửa sở thích" }).click();
    const picker = page.getByRole("dialog").getByTestId("hobby-picker");
    await expect(picker).toBeVisible();
    return picker;
}

test.describe("hobby picker", () => {
    test.use({ viewport: { width: 1360, height: 900 } });

    test("hobbies are grouped by category", async ({ page }) => {
        const picker = await openProfile(page);
        for (const name of ["Thể thao & sức khỏe", "Giải trí", "Học tập & công nghệ", "Đời sống"]) {
            await expect(picker.getByRole("group", { name })).toBeVisible();
        }
        await expect(
            picker.getByRole("group", { name: "Thể thao & sức khỏe" }).getByRole("button", { name: "Cầu lông" })
        ).toBeVisible();
    });

    test("every hobby chip has an icon and a comfortable tap target", async ({ page }) => {
        const picker = await openProfile(page);
        const chip = picker.getByRole("button", { name: "Du lịch" });
        await expect(chip.locator("svg")).toHaveCount(1);
        const box = await chip.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(40);
    });

    test("chips toggle with the mouse and the keyboard", async ({ page }) => {
        const picker = await openProfile(page);
        const chip = picker.getByRole("button", { name: "Du lịch" });
        await expect(chip).toHaveAttribute("aria-pressed", "false");
        await chip.click();
        await expect(chip).toHaveAttribute("aria-pressed", "true");
        await chip.focus();
        await page.keyboard.press("Space");
        await expect(chip).toHaveAttribute("aria-pressed", "false");
    });

    test("the hint guides how many to pick and the count follows the selection", async ({ page }) => {
        const picker = await openProfile(page);
        const hint = picker.getByTestId("hobby-hint");
        await expect(picker).toContainText("Chọn 3–8 sở thích");
        await picker.getByRole("button", { name: "Bỏ chọn tất cả" }).click();
        await expect(picker.getByTestId("hobby-count")).toHaveText("0");
        await expect(hint).toContainText("Chọn thêm");
        for (const name of ["Du lịch", "Cà phê", "Nấu ăn"]) {
            await picker.getByRole("button", { name }).click();
        }
        await expect(picker.getByTestId("hobby-count")).toHaveText("3");
        await expect(hint).toContainText("đủ");
    });

    test("a custom hobby can be added and removed", async ({ page }) => {
        const picker = await openProfile(page);
        await picker.getByRole("button", { name: "Thêm sở thích khác" }).click();
        const input = picker.getByLabel("Sở thích khác");
        await expect(input).toBeFocused();
        await input.fill("Yoga");
        await input.press("Enter");
        const custom = picker.getByRole("group", { name: "Sở thích riêng" });
        await expect(custom).toContainText("Yoga");
        await custom.getByRole("button", { name: "Xóa Yoga" }).click();
        await expect(picker.getByRole("group", { name: "Sở thích riêng" })).toHaveCount(0);
    });

    test("an empty or duplicate custom hobby is ignored", async ({ page }) => {
        const picker = await openProfile(page);
        const before = await picker.getByTestId("hobby-count").innerText();
        await picker.getByRole("button", { name: "Thêm sở thích khác" }).click();
        const input = picker.getByLabel("Sở thích khác");
        await input.press("Enter");
        await input.fill("  ");
        await input.press("Enter");
        await expect(picker.getByTestId("hobby-count")).toHaveText(before);
        await input.fill("du lịch");
        await input.press("Enter");
        await expect(picker.getByRole("group", { name: "Sở thích riêng" })).toHaveCount(0);
    });

    test("the picker does not overflow at 375px", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 });
        const picker = await openProfile(page);
        await picker.scrollIntoViewIfNeeded();
        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
        const box = await picker.boundingBox();
        expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });
});
