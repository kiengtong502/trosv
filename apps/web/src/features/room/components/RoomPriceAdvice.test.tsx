import { fireEvent, render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import { RoomPriceAdvice } from "./RoomPriceAdvice";

const api = vi.hoisted(() => ({ aiPriceAdvice: vi.fn() }));
vi.mock("@/features/ai/api/aiApi", () => api);
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, role: "student" } }),
}));
beforeEach(() => {
  api.aiPriceAdvice.mockReset();
});

it("explains insufficient comparable listings instead of claiming the service is busy", async () => {
  const message = "Chưa đủ tin tương tự để so sánh giá.";
  api.aiPriceAdvice.mockRejectedValue(
    new AxiosError("Request failed", undefined, undefined, undefined, {
      status: 422,
      data: { message },
    } as AxiosResponse),
  );
  render(<RoomPriceAdvice listingId={12} />);
  fireEvent.click(screen.getByRole("button", { name: "Hỏi giá phòng này" }));
  expect(await screen.findByText(message)).toBeVisible();
});
