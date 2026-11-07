import { expect, test, type Page } from "@playwright/test";
import { LANDLORD, STUDENT, loginAs } from "./helpers";

/* Edits stay in the page and are never saved, so the demo database is untouched. */
const section = (page: Page, name: RegExp) => page.getByRole("button", { name });

async function openProfile(page: Page, email = STUDENT) {
  await loginAs(page, email);
  await page.goto("/profile");
  await expect(page.getByTestId("page-header")).toBeVisible();
}

test.describe("profile page (student)", () => {
  test.use({ viewport: { width: 1360, height: 900 } });

  test("shows few controls at first instead of everything at once", async ({ page }) => {
    await openProfile(page);
    const visible = await page
      .locator("main")
      .locator("button:visible, a:visible, input:visible, select:visible, textarea:visible")
      .count();
    expect(visible).toBeLessThanOrEqual(14);
  });

  test("is one calm column with three collapsible sections", async ({ page }) => {
    await openProfile(page);
    for (const name of [/Thông tin cơ bản/, /Học tập & ngân sách/, /Ghép bạn cùng phòng/]) {
      await expect(section(page, name)).toBeVisible();
    }
    const header = await page.getByTestId("page-header").boundingBox();
    const basic = await section(page, /Thông tin cơ bản/).boundingBox();
    const academic = await section(page, /Học tập & ngân sách/).boundingBox();
    // Stacked, not side by side.
    expect(Math.abs(basic!.x - academic!.x)).toBeLessThan(2);
    expect(academic!.y).toBeGreaterThan(basic!.y);
    expect(header!.width).toBeGreaterThan(0);
  });

  test("closed sections summarise their content", async ({ page }) => {
    await openProfile(page);
    await expect(section(page, /Học tập & ngân sách/)).toContainText("ĐHQG");
    await expect(section(page, /Học tập & ngân sách/)).toContainText(/1\.300\.000đ.*2\.700\.000đ/);
    await expect(section(page, /Ghép bạn cùng phòng/)).toContainText("Bật");
    await expect(section(page, /Ghép bạn cùng phòng/)).toContainText(/\d+ sở thích/);
  });

  test("only one section is open at a time", async ({ page }) => {
    await openProfile(page);
    const basic = section(page, /Thông tin cơ bản/);
    const match = section(page, /Ghép bạn cùng phòng/);
    await expect(basic).toHaveAttribute("aria-expanded", "true");
    await match.click();
    await expect(match).toHaveAttribute("aria-expanded", "true");
    await expect(basic).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#p-name")).toBeHidden();
  });

  test("matching section uses light controls", async ({ page }) => {
    await openProfile(page);
    await section(page, /Ghép bạn cùng phòng/).click();
    await expect(page.getByRole("switch", { name: "Tìm bạn ở cùng phòng" })).toBeVisible();
    await expect(page.getByLabel("Giờ giấc ngủ")).toBeVisible();
    await expect(page.getByLabel("Tính cách")).toBeVisible();
    await expect(page.getByRole("slider", { name: /Độ sạch sẽ/ })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Hút thuốc" })).toBeVisible();
    // The 15-chip picker is not inline any more.
    await expect(page.getByTestId("hobby-picker")).toHaveCount(0);
  });

  test("turning matching off hides the matching details", async ({ page }) => {
    await openProfile(page);
    await section(page, /Ghép bạn cùng phòng/).click();
    const toggle = page.getByRole("switch", { name: "Tìm bạn ở cùng phòng" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(page.getByLabel("Giờ giấc ngủ")).toBeHidden();
    await toggle.click();
    await expect(page.getByLabel("Giờ giấc ngủ")).toBeVisible();
  });

  test("hobbies are edited in a dialog and the summary follows", async ({ page }) => {
    await openProfile(page);
    await section(page, /Ghép bạn cùng phòng/).click();
    await page.getByRole("button", { name: "Sửa sở thích" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("hobby-picker")).toBeVisible();
    const before = Number(await dialog.getByTestId("hobby-count").innerText());
    await dialog.getByRole("button", { name: "Du lịch" }).click();
    await expect(dialog.getByTestId("hobby-count")).toHaveText(String(before + 1));
    await dialog.getByRole("button", { name: "Xong" }).click();
    await expect(dialog).toBeHidden();
    // Open section: the hobby line inside it follows the change.
    const panel = page.locator("#profile-match-panel");
    await expect(panel).toContainText("Du lịch");
    await expect(panel).toContainText(`· ${before + 1}`);
    // Closed section: the one-line summary follows it too.
    await section(page, /Ghép bạn cùng phòng/).click();
    await expect(section(page, /Ghép bạn cùng phòng/)).toContainText(`${before + 1} sở thích`);
  });

  test("the save bar appears only when something changed", async ({ page }) => {
    await openProfile(page);
    const bar = page.getByTestId("profile-save-bar");
    await expect(bar).toHaveCount(0);
    const name = page.locator("#p-name");
    const original = await name.inputValue();
    await name.fill(`${original} X`);
    await expect(bar).toBeVisible();
    await expect(bar).toContainText("Có thay đổi chưa lưu");
    await bar.getByRole("button", { name: "Khôi phục" }).click();
    await expect(bar).toHaveCount(0);
    await expect(name).toHaveValue(original);
  });

  test("shows how complete the profile is", async ({ page }) => {
    await openProfile(page);
    await expect(page.getByTestId("profile-completeness")).toContainText(/\d+%/);
  });

  test("does not overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openProfile(page);
    await section(page, /Ghép bạn cùng phòng/).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("profile page (landlord)", () => {
  test("keeps a simple single section", async ({ page }) => {
    await openProfile(page, LANDLORD);
    await expect(page.locator("#p-name")).toBeVisible();
    await expect(section(page, /Ghép bạn cùng phòng/)).toHaveCount(0);
  });
});
