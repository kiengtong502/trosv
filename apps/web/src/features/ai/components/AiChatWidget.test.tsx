import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiChatWidget } from "./AiChatWidget";
import { AI_CHAT_OPEN_EVENT } from "@/shared/constants/events";

const api = vi.hoisted(() => ({ aiChat: vi.fn() }));
vi.mock("../api/aiApi", () => api);
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, role: "student" } }),
}));

beforeEach(() => {
  api.aiChat.mockReset();
});

describe("AI chat room context", () => {
  it("does not badge the welcome message or a conversation already read", () => {
    render(
      <MemoryRouter>
        <AiChatWidget />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("status", { name: "Có phản hồi AI chưa đọc" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Mở trợ lý AI"));
    fireEvent.click(screen.getByLabelText("Đóng trò chuyện"));
    expect(
      screen.queryByRole("status", { name: "Có phản hồi AI chưa đọc" }),
    ).not.toBeInTheDocument();
  });

  it("badges a reply arriving while closed and clears it when opened from the home shortcut", async () => {
    let finish!: (value: { reply: string }) => void;
    api.aiChat.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <MemoryRouter>
        <AiChatWidget />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("Mở trợ lý AI"));
    fireEvent.change(screen.getByLabelText("Hỏi trợ lý AI"), {
      target: { value: "Tìm phòng gần trường" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
    fireEvent.click(screen.getByLabelText("Đóng trò chuyện"));
    expect(
      screen.queryByRole("status", { name: "Có phản hồi AI chưa đọc" }),
    ).not.toBeInTheDocument();
    await act(async () => {
      finish({ reply: "Bạn có thể chọn trường và bán kính tìm phòng." });
      await Promise.resolve();
    });
    expect(screen.getByRole("status", { name: "Có phản hồi AI chưa đọc" })).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event(AI_CHAT_OPEN_EVENT));
    });
    expect(screen.getByText("Bạn có thể chọn trường và bán kính tìm phòng.")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Đóng trò chuyện"));
    expect(
      screen.queryByRole("status", { name: "Có phản hồi AI chưa đọc" }),
    ).not.toBeInTheDocument();
  });

  it("does not badge a reply received while the conversation is open", async () => {
    api.aiChat.mockResolvedValue({ reply: "Phản hồi đã đọc." });
    render(
      <MemoryRouter>
        <AiChatWidget />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("Mở trợ lý AI"));
    fireEvent.change(screen.getByLabelText("Hỏi trợ lý AI"), { target: { value: "Chào bạn" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
    await screen.findByText("Phản hồi đã đọc.");
    fireEvent.click(screen.getByLabelText("Đóng trò chuyện"));
    expect(
      screen.queryByRole("status", { name: "Có phản hồi AI chưa đọc" }),
    ).not.toBeInTheDocument();
  });

  it("sends the current room and previous turns without duplicating the new question", async () => {
    api.aiChat.mockResolvedValue({ reply: "Giá thuê là 2.500.000đ/tháng." });
    render(
      <MemoryRouter initialEntries={["/rooms/77"]}>
        <AiChatWidget />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("Mở trợ lý AI"));
    fireEvent.change(screen.getByLabelText("Hỏi trợ lý AI"), {
      target: { value: "Phòng này giá bao nhiêu?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
    await screen.findByText("Giá thuê là 2.500.000đ/tháng.");
    expect(api.aiChat).toHaveBeenNthCalledWith(1, "Phòng này giá bao nhiêu?", [], 77);

    fireEvent.change(screen.getByLabelText("Hỏi trợ lý AI"), {
      target: { value: "Còn diện tích?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
    await waitFor(() => {
      expect(api.aiChat).toHaveBeenCalledTimes(2);
    });
    expect(api.aiChat).toHaveBeenNthCalledWith(
      2,
      "Còn diện tích?",
      [
        { role: "user", content: "Phòng này giá bao nhiêu?" },
        { role: "assistant", content: "Giá thuê là 2.500.000đ/tháng." },
      ],
      77,
    );
  });

  it("clears the previous room's conversation when navigating to another room", () => {
    render(
      <MemoryRouter initialEntries={["/rooms/77"]}>
        <Link to="/rooms/88">Phòng khác</Link>
        <AiChatWidget />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("Mở trợ lý AI"));
    fireEvent.change(screen.getByLabelText("Hỏi trợ lý AI"), {
      target: { value: "Câu hỏi về phòng cũ" },
    });
    fireEvent.click(screen.getByText("Phòng khác"));
    fireEvent.click(screen.getByLabelText("Mở trợ lý AI"));
    expect(screen.getByLabelText("Hỏi trợ lý AI")).toHaveValue("");
  });
});
