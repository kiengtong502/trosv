import { describe, expect, it, vi } from "vitest";
import { ignoreError } from "./async";

describe("ignoreError", () => {
  it("logs the failure with its name instead of swallowing it silently", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const boom = new Error("boom");

    await Promise.reject(boom).catch(ignoreError("markRead"));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("[ignored] markRead failed", boom);
  });

  it("does not rethrow, so the promise chain continues", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const after = vi.fn();

    await Promise.reject(new Error("x")).catch(ignoreError("ctx")).then(after);

    expect(after).toHaveBeenCalledTimes(1);
  });
});
