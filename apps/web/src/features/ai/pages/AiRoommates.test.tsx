import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import AiRoommates from "./AiRoommates";

const api = vi.hoisted(() => ({ aiRoommates: vi.fn() }));
vi.mock("../api/aiApi", () => api);
beforeEach(() => {
  api.aiRoommates.mockReset();
});

it.each([
  [422, "Hãy hoàn thiện hồ sơ và bật tìm bạn cùng phòng.", true],
  [429, "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.", false],
])(
  "shows the actual HTTP %s error and the appropriate action",
  async (status, message, profileAction) => {
    api.aiRoommates.mockRejectedValue(
      new AxiosError("Request failed", undefined, undefined, undefined, {
        status,
        data: { message },
      } as AxiosResponse),
    );
    render(
      <MemoryRouter>
        <AiRoommates />
      </MemoryRouter>,
    );
    expect(await screen.findByText(message)).toBeVisible();
    expect(Boolean(screen.queryByText("Mở hồ sơ"))).toBe(profileAction);
  },
);
