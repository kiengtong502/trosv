import { expect, test } from "@playwright/test";

// A card's own z-index (heart button, action slot) must never paint over the
// sticky filter bar while the results scroll underneath it.
test("desktop: card hearts scroll under the sticky filter bar, not over it", async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 800 });
  await page.goto("/rooms");
  await page.waitForSelector('[data-testid^="listing-card-"]');
  // Entrance animations give cards a temporary stacking context that hides the bug.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );

  let covered = 0;
  for (let y = 0; y <= 900; y += 40) {
    await page.evaluate((top) => {
      window.scrollTo(0, top);
    }, y);
    covered += await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="plate-band"]')!.getBoundingClientRect();
      let n = 0;
      for (const heart of document.querySelectorAll(
        '[data-testid^="listing-card-"] button[aria-label*="phòng"]',
      )) {
        const r = heart.getBoundingClientRect();
        const x = r.x + r.width / 2;
        const cy = r.y + r.height / 2;
        if (cy <= bar.top + 4 || cy >= bar.bottom - 4 || x <= bar.left || x >= bar.right) continue;
        if (heart.contains(document.elementFromPoint(x, cy))) n++;
      }
      return n;
    });
  }
  expect(covered).toBe(0);
});
