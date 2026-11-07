import { expect, test, type Page } from "@playwright/test";

const API = "http://localhost:8000/api";

/** First public listing that has a ward, so "similar rooms" can be non-empty. */
async function openFirstRoom(page: Page): Promise<number> {
  const res = await page.request.get(`${API}/listings?per_page=20`, {
    headers: { Accept: "application/json" },
  });
  const body = (await res.json()) as { data: { id: number }[] };
  const id = body.data[0]?.id;
  if (id == null) throw new Error("no listings in the dev database");
  await page.goto(`/rooms/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return id;
}

test.describe("room page bento", () => {
  test("hero: gallery and contact card sit side by side on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1320, height: 900 });
    await openFirstRoom(page);
    const gallery = await page.getByTestId("room-gallery").boundingBox();
    const contact = await page.getByTestId("contact-card").boundingBox();
    expect(gallery).not.toBeNull();
    expect(contact).not.toBeNull();
    expect(contact!.x).toBeGreaterThan(gallery!.x + gallery!.width - 2);
    // Same top edge: the bento row starts together.
    expect(Math.abs(contact!.y - gallery!.y)).toBeLessThan(4);
  });

  test("quick facts are tiles in one row on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1320, height: 900 });
    await openFirstRoom(page);
    await page.waitForTimeout(900); // let the entrance stagger settle
    const tiles = page.getByTestId("fact-tile");
    expect(await tiles.count()).toBeGreaterThanOrEqual(2);
    const ys = await tiles.evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().y)),
    );
    expect(new Set(ys).size).toBe(1);
  });

  test("thumbnails switch the main photo", async ({ page }) => {
    await page.setViewportSize({ width: 1320, height: 900 });
    await openFirstRoom(page);
    const thumbs = page.getByTestId("gallery-thumb");
    test.skip((await thumbs.count()) < 2, "listing has a single photo");
    const main = page.getByTestId("gallery-main");
    const before = await main.getAttribute("src");
    await thumbs.nth(1).click();
    await expect(main).not.toHaveAttribute("src", before ?? "");
  });

  test("similar rooms: thumbnails are 4:3, never a wide strip", async ({ page }) => {
    await page.setViewportSize({ width: 1320, height: 900 });
    await openFirstRoom(page);
    const section = page.getByTestId("room-similar");
    test.skip((await section.count()) === 0, "no similar rooms for this listing");
    const imgs = section.getByTestId("similar-thumb");
    expect(await imgs.count()).toBeGreaterThanOrEqual(1);
    const box = await imgs.first().boundingBox();
    const ratio = box!.width / box!.height;
    expect(ratio).toBeGreaterThan(1.25);
    expect(ratio).toBeLessThan(1.4);
  });

  test("similar rooms never include the current room", async ({ page }) => {
    await page.setViewportSize({ width: 1320, height: 900 });
    const id = await openFirstRoom(page);
    const links = page.getByTestId("room-similar").getByRole("link");
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).not.toContain(`/rooms/${id}`);
  });

  test("phone: sticky message bar never covers the last section", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openFirstRoom(page);
    await page.waitForLoadState("networkidle");
    // The shell may scroll inside a container, so push every scrollable ancestor to its end.
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      for (
        let el = document.querySelector('[data-testid="room-end"]')?.parentElement;
        el;
        el = el.parentElement
      ) {
        if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
      }
    });
    await page.waitForTimeout(300);
    const bar = await page.getByTestId("room-mobile-bar").boundingBox();
    expect(bar).not.toBeNull();
    const lastBottom = await page.evaluate(() => {
      const last = document.querySelector('[data-testid="room-end"]');
      return last ? last.getBoundingClientRect().bottom : Infinity;
    });
    expect(lastBottom).toBeLessThanOrEqual(bar!.y + 1);
  });

  test("phone: similar rooms scroll sideways", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openFirstRoom(page);
    const section = page.getByTestId("room-similar");
    test.skip((await section.count()) === 0, "no similar rooms for this listing");
    const row = section.getByTestId("similar-row");
    const overflow = await row.evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflow).toBe("auto");
  });
});
