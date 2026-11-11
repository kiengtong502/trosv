import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime, formatVnd, timeAgo, TYPE_LABELS } from "./format";

describe("formatVnd", () => {
  it.each([
    [0, "0đ"],
    [100_000, "100.000đ"],
    [2_900_000, "2.900.000đ"],
    [10_500_000, "10.500.000đ"],
    [1_234_567_890, "1.234.567.890đ"],
  ])("formats %d exactly, never rounded to tr", (value, expected) => {
    expect(formatVnd(value)).toBe(expected);
  });

  it.each([null, undefined])("shows a dash for %s", (value) => {
    expect(formatVnd(value)).toBe("-");
  });
});

describe("formatDateTime", () => {
  it.each([null, undefined, ""])("is empty for %j", (value) => {
    expect(formatDateTime(value)).toBe("");
  });

  it("formats day/month/year and time", () => {
    const out = formatDateTime("2026-03-05T08:09:00");
    expect(out).toContain("05/03/2026");
    expect(out).toMatch(/08:09/);
  });
});

describe("timeAgo", () => {
  const NOW = new Date("2026-11-07T12:00:00Z");
  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([null, undefined, ""])("is empty for %j", (value) => {
    expect(timeAgo(value)).toBe("");
  });

  it.each([
    [0, "Vừa xong"],
    [59_000, "Vừa xong"],
    [60_000, "1 phút trước"],
    [59 * 60_000, "59 phút trước"],
    [60 * 60_000, "1 giờ trước"],
    [23 * 3_600_000, "23 giờ trước"],
    [24 * 3_600_000, "1 ngày trước"],
    [6 * 86_400_000, "6 ngày trước"],
  ])("%d ms ago reads %s", (ms, expected) => {
    expect(timeAgo(ago(ms))).toBe(expected);
  });

  it("falls back to a full date after a week", () => {
    expect(timeAgo(ago(7 * 86_400_000))).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("TYPE_LABELS", () => {
  it("labels every listing type in Vietnamese", () => {
    expect(TYPE_LABELS).toEqual({
      room: "Phòng trọ",
      apartment: "Căn hộ",
      house: "Nhà nguyên căn",
    });
  });
});
