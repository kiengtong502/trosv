import { expect, test } from "@playwright/test";

function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r = 0, g = 0, b = 0] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const readToken = (name: string) =>
  document.documentElement.style.getPropertyValue(name) ||
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

test.describe("design tokens", () => {
  test("light theme uses the warm palette", async ({ page }) => {
    await page.goto("/");
    const get = (n: string) => page.evaluate(readToken, n);
    expect(await get("--color-paper")).toBe("#fbf8f1");
    expect(await get("--color-ink")).toBe("#1c1915");
    expect(await get("--color-moss")).toBe("#4f6b35");
  });

  test("band, seam and card shadow tokens exist", async ({ page }) => {
    await page.goto("/");
    for (const name of [
      "--color-plate-band-from",
      "--color-plate-band-to",
      "--shadow-seam",
      "--shadow-card",
      "--shadow-card-hover",
    ]) {
      expect(await page.evaluate(readToken, name), name).not.toBe("");
    }
  });

  test("muted text keeps AA contrast on paper and card (light)", async ({ page }) => {
    await page.goto("/");
    const muted = await page.evaluate(readToken, "--color-muted");
    const paper = await page.evaluate(readToken, "--color-paper");
    const card = await page.evaluate(readToken, "--color-card");
    expect(contrast(muted, paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(muted, card)).toBeGreaterThanOrEqual(4.5);
  });
});
