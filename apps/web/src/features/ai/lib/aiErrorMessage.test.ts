import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { aiErrorMessage } from "./aiErrorMessage";

describe("AI errors", () => {
  it.each([
    [422, "Chưa đủ tin tương tự để so sánh giá."],
    [429, "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."],
    [503, "Dịch vụ AI tạm thời không khả dụng."],
  ])("preserves the backend explanation for HTTP %s", (status, message) => {
    const error = new AxiosError("Request failed", undefined, undefined, undefined, {
      status,
      data: { message },
    } as AxiosResponse);
    expect(aiErrorMessage(error)).toBe(message);
  });

  it("explains a network failure in Vietnamese", () => {
    expect(aiErrorMessage(new AxiosError("Network Error"))).toContain("Không kết nối được");
  });
});
