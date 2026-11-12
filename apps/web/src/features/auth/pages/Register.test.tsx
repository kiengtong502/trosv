import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterPayload, User } from "@/shared/types/api";
import Register from "./Register";

const register = vi.hoisted(() => vi.fn<(payload: RegisterPayload) => Promise<User>>());
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => ({ register }) }));

const ADA = { id: 1, name: "Ada", email: "ada@example.com", role: "student" } as User;

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<p>trang chủ</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const field = (id: string): HTMLInputElement => {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) throw new Error(`no input #${id}`);
  return el;
};
const type = (id: string, value: string) => {
  fireEvent.change(field(id), { target: { value } });
};
/** Click and let the async submit settle, so assertions see the final state. */
const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
    await Promise.resolve();
  });
};
/** The form-level banner. Every Field also renders its own role="alert" slot (id ends in -error). */
const banner = () => screen.queryAllByRole("alert").find((el) => !el.id.endsWith("-error"));
function fillValid() {
  type("name", "  Ada Lovelace ");
  type("email", " ada@example.com ");
  type("password", "password1");
  type("password_confirmation", "password1");
}
function apiError(status: number, data: unknown) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

beforeEach(() => {
  register.mockReset();
});

describe("Register page", () => {
  it("sets the document title and links to login", () => {
    renderRegister();
    expect(document.title).toBe("Đăng ký · TROSV");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
  });

  it("registers as a student by default, with trimmed name and email", async () => {
    register.mockResolvedValue(ADA);
    renderRegister();
    fillValid();
    await submit();

    expect(await screen.findByText("trang chủ")).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password1",
      password_confirmation: "password1",
      role: "student",
    });
  });

  it("registers as a landlord when that role is picked", async () => {
    register.mockResolvedValue({ ...ADA, role: "landlord" });
    renderRegister();
    fireEvent.click(screen.getByLabelText("Tôi cho thuê"));
    fillValid();
    await submit();

    await screen.findByText("trang chủ");
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ role: "landlord" }));
  });

  it("does not call the API when the two passwords differ, and says so next to the field", async () => {
    renderRegister();
    type("name", "Ada");
    type("email", "ada@example.com");
    type("password", "password1");
    type("password_confirmation", "password2");
    await submit();

    expect(screen.getByText("Mật khẩu nhập lại chưa khớp.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    expect(banner()).toBeUndefined(); // the field message is the only feedback
  });

  it("shows each server validation message under its own field", async () => {
    register.mockRejectedValue(
      apiError(422, {
        message: "Dữ liệu không hợp lệ.",
        errors: { email: ["Email đã được sử dụng."], password: ["Mật khẩu quá yếu."] },
      }),
    );
    renderRegister();
    fillValid();
    await submit();

    expect(await screen.findByText("Email đã được sử dụng.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu quá yếu.")).toBeInTheDocument();
    expect(banner()).toHaveTextContent("Dữ liệu không hợp lệ.");
    expect(screen.queryByText("trang chủ")).not.toBeInTheDocument();
  });

  it("clears old server errors on the next submit", async () => {
    register
      .mockRejectedValueOnce(
        apiError(422, { message: "x", errors: { email: ["Email đã được sử dụng."] } }),
      )
      .mockResolvedValueOnce(ADA);
    renderRegister();
    fillValid();
    await submit();
    await screen.findByText("Email đã được sử dụng.");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Tạo tài khoản" })).toBeEnabled();
    });

    await submit();
    expect(await screen.findByText("trang chủ")).toBeInTheDocument();
  });

  it("falls back to a friendly message for an unknown failure", async () => {
    register.mockRejectedValue("boom");
    renderRegister();
    fillValid();
    await submit();

    await waitFor(() => {
      expect(banner()).toHaveTextContent("Đăng ký không thành công. Bạn thử lại nhé.");
    });
  });

  it("the live checklist follows the password and its confirmation", () => {
    renderRegister();
    const item = (label: string) => screen.getByText(label).closest("li");
    expect(item("Tối thiểu 8 ký tự")).toHaveClass("text-muted");
    expect(item("Hai mật khẩu khớp nhau")).toHaveClass("text-muted");

    type("password", "password1");
    expect(item("Tối thiểu 8 ký tự")).toHaveClass("font-medium");
    expect(item("Hai mật khẩu khớp nhau")).toHaveClass("text-muted");

    type("password_confirmation", "password1");
    expect(item("Hai mật khẩu khớp nhau")).toHaveClass("font-medium");
  });
});
