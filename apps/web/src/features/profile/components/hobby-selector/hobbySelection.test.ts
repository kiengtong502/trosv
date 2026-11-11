import { describe, expect, it } from "vitest";
import { HOBBY_LIST } from "@/features/profile/lib/hobbies";
import {
  addTypedHobby,
  customKeys,
  hasKey,
  joinKeys,
  meterPercent,
  removeKey,
  statusText,
  toggleKey,
  uniqueKeys,
} from "./hobbySelection";

describe("uniqueKeys / joinKeys", () => {
  it("trims, drops blanks and duplicates, keeping the first spelling", () => {
    expect(uniqueKeys([" gym ", "", "music", "gym", "  "])).toEqual(["gym", "music"]);
  });

  it("joins with commas, and an empty selection is an empty string", () => {
    expect(joinKeys(["gym", "music"])).toBe("gym,music");
    expect(joinKeys([])).toBe("");
  });
});

describe("hasKey / removeKey / toggleKey", () => {
  it("compares keys case-insensitively", () => {
    expect(hasKey(["Gym"], "gym")).toBe(true);
    expect(hasKey(["gym"], "music")).toBe(false);
  });

  it("removes regardless of case", () => {
    expect(removeKey(["Gym", "music"], "gym")).toEqual(["music"]);
  });

  it("toggles on and off", () => {
    expect(toggleKey(["gym"], "music")).toEqual(["gym", "music"]);
    expect(toggleKey(["gym", "music"], "GYM")).toEqual(["music"]);
  });

  it("never mutates its input", () => {
    const keys = ["gym"];
    toggleKey(keys, "music");
    removeKey(keys, "gym");
    expect(keys).toEqual(["gym"]);
  });
});

describe("addTypedHobby", () => {
  it("ignores blank input", () => {
    expect(addTypedHobby(["gym"], "   ")).toEqual(["gym"]);
  });

  it("adds a custom hobby as typed", () => {
    expect(addTypedHobby(["gym"], "  Yoga ")).toEqual(["gym", "Yoga"]);
  });

  it("selects the preset instead of duplicating it when the key is typed", () => {
    expect(addTypedHobby([], "MUSIC")).toEqual(["music"]);
  });

  it("selects the preset when its label is typed", () => {
    const preset = HOBBY_LIST[0];
    expect(preset).toBeDefined();
    expect(addTypedHobby([], preset?.label.toUpperCase() ?? "")).toEqual([preset?.key]);
  });

  it("does not add a hobby that is already selected, in any case", () => {
    expect(addTypedHobby(["Yoga"], "yoga")).toEqual(["Yoga"]);
    expect(addTypedHobby(["music"], "music")).toEqual(["music"]);
  });
});

describe("customKeys", () => {
  it("keeps only keys that are not presets", () => {
    expect(customKeys(["gym", "Yoga", "MUSIC", "origami"])).toEqual(["Yoga", "origami"]);
  });
});

describe("statusText / meterPercent", () => {
  it.each([
    [0, "Chọn thêm 3 sở thích nữa"],
    [2, "Chọn thêm 1 sở thích nữa"],
    [3, "Vậy là đủ để AI ghép bạn cùng phòng"],
    [8, "Vậy là đủ để AI ghép bạn cùng phòng"],
    [9, "Bạn có nhiều sở thích, AI sẽ ưu tiên những điểm chung"],
  ])("%d picked -> %s", (count, text) => {
    expect(statusText(count)).toBe(text);
  });

  it("fills the meter up to the minimum and stops there", () => {
    expect(meterPercent(0)).toBe(0);
    expect(meterPercent(3)).toBe(100);
    expect(meterPercent(8)).toBe(100);
    expect(meterPercent(1)).toBeCloseTo(33.33, 1);
  });
});
