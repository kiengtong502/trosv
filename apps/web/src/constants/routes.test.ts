import { describe, expect, it } from "vitest";
import { ROUTES, route } from "./routes";

describe("route", () => {
  it("fills :params", () => {
    expect(route(ROUTES.ROOM_DETAIL, { id: 42 })).toBe("/rooms/42");
  });

  it("returns the pattern untouched when there are no params", () => {
    expect(route("/rooms")).toBe("/rooms");
  });

  it("fills several params", () => {
    expect(route("/a/:x/b/:y", { x: 1, y: "two" })).toBe("/a/1/b/two");
  });

  it("encodes unsafe characters", () => {
    expect(route("/search/:q", { q: "phòng trọ/gần" })).toBe(
      "/search/ph%C3%B2ng%20tr%E1%BB%8D%2Fg%E1%BA%A7n",
    );
  });

  it("ignores params the pattern does not use", () => {
    expect(route("/rooms", { id: 1 })).toBe("/rooms");
  });
});

describe("ROUTES", () => {
  it("only has absolute paths", () => {
    for (const path of Object.values(ROUTES)) {
      expect(path.startsWith("/")).toBe(true);
    }
  });
});
