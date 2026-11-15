import { expect, test } from "@playwright/test";
import { LANDLORD, STUDENT, loginAs } from "../design/helpers";

test("school picker lists all 61 schools directly, including Đông Hòa references", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/rooms");
  await page.getByRole("button", { name: "Chọn trường", exact: true }).click();
  await expect(page.locator("#near-school-ward")).toHaveCount(0);
  await expect(page.getByLabel("Tìm theo tên trường", { exact: true })).toBeVisible();
  await expect(page.locator("#filter-school option")).toHaveCount(62);
  for (const name of ["Đại học Quốc tế (HCMIU)", "Đại học Khoa học Sức khỏe (UHS)"]) {
    await expect(
      page.locator("#filter-school").getByRole("option", { name, exact: true }),
    ).toHaveCount(1);
  }
  for (const [query, name] of [
    ["ueh", "Đại học Kinh tế TP.HCM (UEH)"],
    ["hutech", "Đại học Công nghệ TP.HCM (HUTECH)"],
    ["tdtu", "Đại học Tôn Đức Thắng (TDTU)"],
  ] as const) {
    await page.getByLabel("Tìm theo tên trường", { exact: true }).fill(query);
    await expect(page.locator("#filter-school option")).toHaveCount(2);
    await expect(
      page.locator("#filter-school").getByRole("option", { name, exact: true }),
    ).toHaveCount(1);
  }
});

for (const [role, email] of [
  ["student", STUDENT],
  ["landlord", LANDLORD],
] as const) {
  for (const width of [1280, 390]) {
    test(`${role} ${String(width)}: choose school by name independently of room area`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await loginAs(page, email);
      await page.goto("/rooms");
      const open = async (label: string) => {
        await page.getByRole("button", { name: label, exact: true }).click();
      };
      await open("Chọn trường");
      const query = page.getByLabel("Tìm theo tên trường", { exact: true });
      const school = page.locator("#filter-school");
      await query.fill("tu nhien");
      await expect(school.locator("option")).toHaveCount(2);
      await school.selectOption({ label: "Đại học Khoa học Tự nhiên (HCMUS)" });
      const schoolId = await school.inputValue();
      await expect(query).toHaveValue("");
      const nearSchool = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname.endsWith("/api/listings") &&
          url.searchParams.get("school_id") === schoolId &&
          url.searchParams.get("max_km") === "5"
        );
      });
      await page.locator("#filter-radius").selectOption("5");
      const initial = await nearSchool;
      expect(initial.status()).toBe(200);
      expect(new URL(initial.url()).searchParams.has("ward_id")).toBe(false);
      expect(new URL(initial.url()).searchParams.has("q")).toBe(false);
      await page.keyboard.press("Escape");

      await open("Khu vực");
      const roomWard = page.locator("#filter-ward");
      const filteredRooms = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname.endsWith("/api/listings") &&
          url.searchParams.has("ward_id") &&
          url.searchParams.get("school_id") === schoolId &&
          url.searchParams.get("max_km") === "5"
        );
      });
      await roomWard.selectOption({ label: "Phường Diên Hồng" });
      const roomWardId = await roomWard.inputValue();
      const filtered = await filteredRooms;
      expect(filtered.status()).toBe(200);
      expect(new URL(filtered.url()).searchParams.get("ward_id")).toBe(roomWardId);
      const body = (await filtered.json()) as { data: { ward: { id: number } }[] };
      for (const listing of body.data) expect(String(listing.ward.id)).toBe(roomWardId);
      await page.keyboard.press("Escape");

      await open("Chọn trường");
      await expect(school).toHaveValue(schoolId);
      await expect(school.locator("option")).toHaveCount(62);
      await expect(page.locator("#filter-radius")).toHaveValue("5");
      await query.fill("bach khoa");
      await expect(
        school.getByRole("option", { name: "Đại học Bách khoa (HCMUT)", exact: true }),
      ).toHaveCount(1);
      await expect(school).toHaveValue(schoolId);
      await school.selectOption({ label: "Đại học Bách khoa (HCMUT)" });
      const otherSchoolId = await school.inputValue();
      await query.fill("truong khong ton tai 123");
      await expect(page.getByRole("status")).toHaveText("Không tìm thấy trường phù hợp.");
      await expect(school).toHaveValue(otherSchoolId);
      await expect(page.locator("#filter-radius")).toHaveValue("5");
      await page.keyboard.press("Escape");

      await open("Khu vực");
      await expect(roomWard).toHaveValue(roomWardId);
      await page
        .getByRole("dialog")
        .filter({ has: roomWard })
        .getByRole("button", { name: "Xóa lọc này", exact: true })
        .click();
      await expect(roomWard).toHaveValue("");
      await roomWard.selectOption({ label: "Phường Sài Gòn" });
      const keptRoomWardId = await roomWard.inputValue();
      await page.keyboard.press("Escape");
      await open("Chọn trường");
      await expect(school).toHaveValue(otherSchoolId);
      await expect(page.locator("#filter-radius")).toHaveValue("5");
      await page
        .getByRole("dialog")
        .filter({ has: school })
        .getByRole("button", { name: "Xóa lọc này", exact: true })
        .click();
      await expect(school).toHaveValue("");
      await expect(query).toHaveValue("");
      await expect(page.locator("#filter-radius")).toHaveCount(0);
      await query.fill("ton duc thang");
      await page.keyboard.press("Escape");

      await open("Khu vực");
      await expect(roomWard).toHaveValue(keptRoomWardId);
      await page.getByRole("button", { name: "Đặt lại", exact: true }).click();
      await expect(roomWard).toHaveValue("");
      await page.keyboard.press("Escape");
      await open("Chọn trường");
      await expect(query).toHaveValue("");
      await expect(school).toHaveValue("");
      await expect(school.locator("option")).toHaveCount(62);
    });
  }
}
