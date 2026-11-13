import { expect, test, type Page } from "@playwright/test";
import { settleAnimations } from "./helpers";

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
  // The bento grid fades up child by child (motion-stagger). Measure only once it has settled.
  await settleAnimations(page);
  return id;
}

test.describe("room page bento", () => {
  test("room content fits phone, tablet and desktop widths", async ({ page }) => {
    await openFirstRoom(page);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await settleAnimations(page);
      const sizes = await page.evaluate(() => {
        const gallery = document.querySelector('[data-testid="room-gallery"]')!;
        const bounds = gallery.getBoundingClientRect();
        return {
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth,
          galleryLeft: bounds.left,
          galleryRight: bounds.right,
        };
      });
      expect(sizes.page, `page overflow at ${width}px`).toBeLessThanOrEqual(sizes.viewport + 1);
      expect(sizes.galleryLeft).toBeGreaterThanOrEqual(0);
      expect(sizes.galleryRight).toBeLessThanOrEqual(sizes.viewport + 1);
      if (width < 768) {
        const title = await page.getByRole("heading", { level: 1 }).boundingBox();
        const share = await page.getByRole("button", { name: "Chia sẻ", exact: true }).boundingBox();
        expect(title!.width).toBeCloseTo(sizes.galleryRight - sizes.galleryLeft, 0);
        expect(share!.y).toBeGreaterThanOrEqual(title!.y + title!.height);
      }
    }
  });

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
    const bar = await page.getByTestId("room-mobile-bar").boundingBox();
    expect(bar).not.toBeNull();

    // Content below the fold (similar rooms, images) can still grow after load, so keep pushing
    // every scrollable ancestor to its end until the last section settles above the bar.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const last = document.querySelector('[data-testid="room-end"]');
            if (!last) return Infinity;
            window.scrollTo(0, document.documentElement.scrollHeight);
            for (let el = last.parentElement; el; el = el.parentElement) {
              if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
            }
            return last.getBoundingClientRect().bottom;
          }),
        { timeout: 8000 },
      )
      .toBeLessThanOrEqual(bar!.y + 1);
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
