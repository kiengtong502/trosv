import { fireEvent, render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomPriceAdvice } from "./RoomPriceAdvice";

const mocks = vi.hoisted(() => ({ aiPriceAdvice: vi.fn() }));
vi.mock("@/features/ai/api/aiApi", () => ({ aiPriceAdvice: mocks.aiPriceAdvice }));
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "student" } }),
}));

const apiError = (status: number, message: string) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse);

const ask = () => {
  fireEvent.click(screen.getByRole("button", { name: /Hỏi giá phòng này/ }));
};

beforeEach(() => {
  mocks.aiPriceAdvice.mockReset();
});

describe("RoomPriceAdvice", () => {
  it.each([
    [422, "Chưa đủ tin tương tự để so sánh giá."],
    [429, "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."],
  ])("shows the backend reason for a %i", async (status, message) => {
    mocks.aiPriceAdvice.mockRejectedValue(apiError(status, message));
    render(<RoomPriceAdvice listingId={1} />);
    ask();
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("keeps the generic busy message for server errors", async () => {
    mocks.aiPriceAdvice.mockRejectedValue(apiError(503, "AI down"));
    render(<RoomPriceAdvice listingId={1} />);
    ask();
    expect(await screen.findByText(/Trợ lý AI đang bận/)).toBeInTheDocument();
  });

  it("says the comparison widened to the city", async () => {
    mocks.aiPriceAdvice.mockResolvedValue({
      fair_min: 2070000,
      fair_max: 2530000,
      tips: ["Hỏi rõ tiền điện nước"],
      stats: { count: 5, scope: "city" },
    });
    render(<RoomPriceAdvice listingId={1} />);
    ask();
    expect(await screen.findByText(/dựa trên 5 phòng tương tự cùng thành phố/)).toBeInTheDocument();
  });
});
