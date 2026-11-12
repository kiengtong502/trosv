import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing, User } from "@/shared/types/api";
import { RoomContactCard } from "./RoomContactCard";

const mocks = vi.hoisted(() => ({
  startConversation: vi.fn(),
  toast: vi.fn(),
  user: { current: null as User | null },
}));
vi.mock("@/features/messaging/api/messagingApi", () => ({
  startConversation: mocks.startConversation,
}));
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user.current }),
}));
vi.mock("@/shared/ui/toast", () => ({ toast: mocks.toast }));

const STUDENT = { id: 1, role: "student" } as User;
const LANDLORD_USER = { id: 9, role: "landlord" } as User;

const listing = (over: Record<string, unknown> = {}) =>
  ({
    id: 12,
    price: 2500000,
    status: "available",
    landlord: { id: 9, name: "Cô Lan", phone: "0901234567", avatar: null },
    ...over,
  }) as unknown as Listing;

function renderCard(l: Listing) {
  return render(
    <MemoryRouter initialEntries={["/rooms/12"]}>
      <Routes>
        <Route path="/rooms/12" element={<RoomContactCard listing={l} />} />
        <Route path="/login" element={<p>trang đăng nhập</p>} />
        <Route path="/messages/:id" element={<p>hội thoại</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const messageButton = () => screen.getByRole("button", { name: /Nhắn tin cho chủ nhà/ });

beforeEach(() => {
  mocks.startConversation.mockReset();
  mocks.toast.mockReset();
  mocks.user.current = STUDENT;
});

describe("RoomContactCard: contacting the landlord", () => {
  it("sends a signed-out visitor to log in first", async () => {
    mocks.user.current = null;
    renderCard(listing());
    fireEvent.click(messageButton());

    expect(await screen.findByText("trang đăng nhập")).toBeInTheDocument();
    expect(mocks.startConversation).not.toHaveBeenCalled();
  });

  it("opens the conversation for a signed-in student", async () => {
    mocks.startConversation.mockResolvedValue({ id: 77 });
    renderCard(listing());
    fireEvent.click(messageButton());

    expect(await screen.findByText("hội thoại")).toBeInTheDocument();
    expect(mocks.startConversation).toHaveBeenCalledWith(12);
  });

  it("stays on the page and apologises when the conversation cannot be opened", async () => {
    mocks.startConversation.mockRejectedValue(new Error("403"));
    renderCard(listing());
    fireEvent.click(messageButton());

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith("Không mở được hội thoại. Bạn thử lại nhé.");
    });
    expect(screen.queryByText("hội thoại")).not.toBeInTheDocument();
    expect(messageButton()).toBeInTheDocument();
  });
});

describe("RoomContactCard: what is shown", () => {
  it("shows the landlord and a call link when there is a phone number", () => {
    renderCard(listing());
    expect(screen.getByText("Cô Lan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gọi 0901234567" })).toHaveAttribute(
      "href",
      "tel:0901234567",
    );
    expect(screen.queryByText(/Đăng nhập bằng tài khoản sinh viên/)).not.toBeInTheDocument();
  });

  it("falls back to 'Chưa rõ' when the landlord is unknown", () => {
    renderCard(listing({ landlord: undefined }));
    expect(screen.getByText("Chưa rõ")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Gọi/ })).not.toBeInTheDocument();
  });

  it("tells non-students without a visible number how to get it", () => {
    mocks.user.current = null;
    renderCard(listing({ landlord: { id: 9, name: "Cô Lan", phone: null } }));
    expect(
      screen.getByText(/Đăng nhập bằng tài khoản sinh viên để xem số điện thoại/),
    ).toBeInTheDocument();

    mocks.user.current = LANDLORD_USER;
    renderCard(listing({ landlord: { id: 9, name: "Cô Lan", phone: null } }));
    expect(screen.getAllByText(/Đăng nhập bằng tài khoản sinh viên/)).toHaveLength(2);
  });

  it("does not nag a student who simply has no number to show", () => {
    renderCard(listing({ landlord: { id: 9, name: "Cô Lan", phone: null } }));
    expect(screen.queryByText(/Đăng nhập bằng tài khoản sinh viên/)).not.toBeInTheDocument();
  });

  it.each([
    ["available", "Còn trống"],
    ["rented", "Đã thuê"],
    ["hidden", "Đang ẩn"],
  ])("labels a %s room '%s'", (status, label) => {
    renderCard(listing({ status }));
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows the monthly price", () => {
    renderCard(listing());
    expect(screen.getByTestId("contact-card")).toHaveTextContent("/tháng");
  });
});
