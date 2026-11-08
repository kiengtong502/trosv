import { describe, expect, it } from "vitest";
import {
  CLUSTER_MS,
  TIME_GAP_MS,
  dayKey,
  formatDayLabel,
  layoutRow,
  type LayoutMessage,
} from "./threadLayout";

const T0 = new Date("2026-11-07T10:00:00").getTime();
const at = (ms: number) => new Date(T0 + ms).toISOString();
const msg = (ms: number, mine: boolean, extra: Partial<LayoutMessage> = {}): LayoutMessage => ({
  created_at: at(ms),
  is_mine: mine,
  ...extra,
});

describe("layoutRow clustering", () => {
  it("a lone message is a single bubble that shows its timestamp", () => {
    const row = layoutRow([msg(0, true)], 0);
    expect(row).toMatchObject({ shape: "single", lastInCluster: true, newDay: true });
  });

  it("two quick messages from one sender form first + last", () => {
    const list = [msg(0, true), msg(10_000, true)];
    expect(layoutRow(list, 0)).toMatchObject({ shape: "first", lastInCluster: false });
    expect(layoutRow(list, 1)).toMatchObject({ shape: "last", lastInCluster: true });
  });

  it("three in a row give first, middle, last", () => {
    const list = [msg(0, true), msg(10_000, true), msg(20_000, true)];
    expect(list.map((_, i) => layoutRow(list, i).shape)).toEqual(["first", "middle", "last"]);
  });

  it("a different sender breaks the cluster", () => {
    const list = [msg(0, true), msg(10_000, false)];
    expect(layoutRow(list, 0).shape).toBe("single");
    expect(layoutRow(list, 1).shape).toBe("single");
  });

  it("the cluster window is exclusive at 3 minutes", () => {
    const inside = [msg(0, true), msg(CLUSTER_MS - 1, true)];
    const edge = [msg(0, true), msg(CLUSTER_MS, true)];
    expect(layoutRow(inside, 1).groupedWithPrev).toBe(true);
    expect(layoutRow(edge, 1).groupedWithPrev).toBe(false);
    expect(layoutRow(edge, 0).groupedWithNext).toBe(false);
  });
});

describe("layoutRow separators", () => {
  it("shows a time separator after a 20 minute silence, but not before", () => {
    const quiet = [msg(0, true), msg(TIME_GAP_MS - 1, true)];
    const gap = [msg(0, true), msg(TIME_GAP_MS, true)];
    expect(layoutRow(quiet, 1).showTimeGap).toBe(false);
    expect(layoutRow(gap, 1).showTimeGap).toBe(true);
  });

  it("a time gap also breaks the cluster", () => {
    const list = [msg(0, true), msg(TIME_GAP_MS, true)];
    expect(layoutRow(list, 1).groupedWithPrev).toBe(false);
    expect(layoutRow(list, 0).groupedWithNext).toBe(false);
  });

  it("starts a new day (and no time separator) across midnight", () => {
    const list = [msg(0, true), msg(24 * 3_600_000, true)];
    expect(layoutRow(list, 1)).toMatchObject({
      newDay: true,
      showTimeGap: false,
      groupedWithPrev: false,
    });
  });

  it("only the first message of the thread has no previous", () => {
    expect(layoutRow([msg(0, true), msg(1000, true)], 1).newDay).toBe(false);
  });
});

describe("layoutRow reactions", () => {
  it("flags a row that follows a reacted message", () => {
    const list = [msg(0, false, { reactions: { "1": "👍" } }), msg(10_000, true)];
    expect(layoutRow(list, 1).prevHasReactions).toBe(true);
  });

  it.each([{}, { reactions: null }, { reactions: {} }])("ignores empty reactions %j", (extra) => {
    const list = [msg(0, false, extra), msg(10_000, true)];
    expect(layoutRow(list, 1).prevHasReactions).toBe(false);
  });
});

describe("layoutRow input", () => {
  it("rejects an index outside the list", () => {
    expect(() => layoutRow([msg(0, true)], 3)).toThrow(RangeError);
  });
});

describe("formatDayLabel", () => {
  const NOW = new Date("2026-11-07T12:00:00");

  it("says 'Hôm nay' for today and 'Hôm qua' for yesterday", () => {
    expect(formatDayLabel("2026-11-07T01:00:00", NOW)).toBe("Hôm nay");
    expect(formatDayLabel("2026-11-06T23:00:00", NOW)).toBe("Hôm qua");
  });

  it("uses dd/mm/yyyy for anything older", () => {
    expect(formatDayLabel("2026-10-30T09:00:00", NOW)).toContain("30/10/2026");
  });

  it("handles the first day of a month (yesterday is in the previous month)", () => {
    expect(formatDayLabel("2026-10-31T09:00:00", new Date("2026-11-01T09:00:00"))).toBe("Hôm qua");
  });
});

describe("dayKey", () => {
  it("is equal within a day and different across days", () => {
    expect(dayKey("2026-11-07T00:00:01")).toBe(dayKey("2026-11-07T23:59:59"));
    expect(dayKey("2026-11-07T23:59:59")).not.toBe(dayKey("2026-11-08T00:00:00"));
  });
});
