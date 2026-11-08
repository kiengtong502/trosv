import { describe, expect, it } from "vitest";
import { toggleId } from "./list";

describe("toggleId", () => {
  it("adds a missing item and removes a present one", () => {
    expect(toggleId([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleId([1, 2], 1)).toEqual([2]);
  });

  it("works for strings and an empty list", () => {
    expect(toggleId([], "a")).toEqual(["a"]);
    expect(toggleId(["a"], "a")).toEqual([]);
  });

  it("never mutates its input", () => {
    const items = [1, 2];
    toggleId(items, 3);
    toggleId(items, 1);
    expect(items).toEqual([1, 2]);
  });
});
