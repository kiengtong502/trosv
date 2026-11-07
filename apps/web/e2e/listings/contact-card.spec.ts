import { expect, test } from "@playwright/test";

/**
 * Regression guard: the landlord contact card (`[data-testid="contact-card"]`)
 * must never paint over the sticky header while scrolling.
 *
 * Bug (old markup): both elements were Bootstrap `.sticky-top` (z-index
 * 1020); the card slid over the 57px navbar. The card is now a bento tile
 * that scrolls with the page, so it may slide under the header but must
 * never paint over it. Checked by hit-testing the header's centre at every
 * scroll depth.
 */
test.describe("room detail sticky contact card", () => {
  test("card stays below the header at every scroll depth", async ({ page }) => {
    await page.goto("/rooms");

    await page.locator('[data-testid^="listing-card-"]').first().click();
    const card = page.locator('[data-testid="contact-card"]');
    const header = page.locator("header").first();
    await expect(card).toBeVisible();
    await expect(header).toBeVisible();

    // Multiple depths: top, several middle positions, page bottom.
    // The card scrolls with the page (bento tile), so it may slide under the
    // header; what must never happen is the card painting OVER the header.
    for (const y of [0, 400, 1200, 3000, 99999]) {
      await page.evaluate((v) => {
        window.scrollTo(0, v);
      }, y);
      await page.evaluate(() => requestAnimationFrame(() => undefined));

      const nav = await header.boundingBox();
      if (!nav) throw new Error(`header missing at scrollY=${y}`);
      const coveredByCard = await page.evaluate(
        ([x, yy]) => {
          const hit = document.elementFromPoint(x as number, yy as number);
          return !!hit?.closest('[data-testid="contact-card"]');
        },
        [nav.x + nav.width / 2, nav.y + nav.height / 2],
      );
      expect(coveredByCard, `card must not paint over the header at scrollY=${y}`).toBe(false);
    }
  });
});
