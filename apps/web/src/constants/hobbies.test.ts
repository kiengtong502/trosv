import { describe, expect, it } from "vitest";
import {
  HOBBY_GROUPS,
  HOBBY_LIST,
  HOBBY_PICK_MAX,
  HOBBY_PICK_MIN,
  formatHobby,
  parseHobbies,
} from "./hobbies";

describe("formatHobby", () => {
  it("returns the known hobby for a preset key", () => {
    expect(formatHobby("gym").key).toBe("gym");
  });

  it("matches preset keys case-insensitively and ignores padding", () => {
    expect(formatHobby("  GYM ").key).toBe("gym");
  });

  it("keeps a custom tag, capitalised, with no icon", () => {
    expect(formatHobby("  chơi cờ")).toEqual({ key: "chơi cờ", label: "Chơi cờ", icon: "" });
  });
});

describe("parseHobbies", () => {
  it.each([null, undefined, ""])("is empty for %j", (value) => {
    expect(parseHobbies(value)).toEqual([]);
  });

  it("splits a comma separated string and trims", () => {
    expect(parseHobbies("gym, music ,coding").map((h) => h.key)).toEqual([
      "gym",
      "music",
      "coding",
    ]);
  });

  it("accepts an array and drops blank entries", () => {
    expect(parseHobbies(["gym", "", "  "]).map((h) => h.key)).toEqual(["gym"]);
  });

  it("mixes presets and custom tags", () => {
    const [preset, custom] = parseHobbies("gym,origami");
    expect(preset?.icon).not.toBe("");
    expect(custom?.icon).toBe("");
  });
});

describe("hobby catalogue invariants", () => {
  it("shows every preset hobby in exactly one group", () => {
    const grouped = HOBBY_GROUPS.flatMap((g) => g.hobbies);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(HOBBY_LIST.map((h) => h.key).sort());
  });

  it("has a sensible pick range", () => {
    expect(HOBBY_PICK_MIN).toBeLessThan(HOBBY_PICK_MAX);
  });
});
