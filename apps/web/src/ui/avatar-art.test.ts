import { describe, expect, it } from "vitest";
import { AVATAR_KEYS, AVATAR_NAMES, AVATAR_SVG, isAvatarKey } from "./avatar-art";

describe("avatar art", () => {
  it("has 12 hand-drawn critters", () => {
    expect(AVATAR_KEYS).toHaveLength(12);
    expect(new Set(AVATAR_KEYS).size).toBe(12);
  });

  it.each(AVATAR_KEYS)("%s has a Vietnamese name and an SVG", (key) => {
    expect(AVATAR_NAMES[key]).toBeTruthy();
    expect(AVATAR_SVG[key]).toContain("<");
  });

  it.each(AVATAR_KEYS)("isAvatarKey accepts %s", (key) => {
    expect(isAvatarKey(key)).toBe(true);
  });

  it.each(["", "dragon", "CAT", null, undefined, 3, {}])("isAvatarKey rejects %j", (value) => {
    expect(isAvatarKey(value)).toBe(false);
  });
});
