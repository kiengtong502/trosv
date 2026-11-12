import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/shared/types/api";
import Login from "./Login";

const login = vi.hoisted(() => vi.fn<(email: string, password: string) => Promise<User>>());
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => ({ login }) }));

const ADA = { id: 1, name: "Ada", email: "ada@example.com", role: "student" } as User;

function renderLogin(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/login", state }]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>trang chủ</p>} />
        <Route path="/rooms/12" element={<p>phòng 12</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const emailInput = () => screen.getByLabelText(/^Email/);
const passwordInput = () => screen.getByLabelText(/^Mật khẩu/, { selector: "input" });
/** Click and let the async submit settle, so assertions see the final state. */
const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await Promise.resolve();
  });
};
/** The form-level banner. Every Field also renders its own role="alert" slot (id ends in -error). */
const banner = () => screen.queryAllByRole("alert").find((el) => !el.id.endsWith("-error"));
function fill(email: string, password: string) {
  fireEvent.change(emailInput(), { target: { value: email } });
  fireEvent.change(passwordInput(), { target: { value: password } });
}

/** An axios error shaped like the API's 401/422 JSON. */
function apiError(status: number, data: unknown) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

beforeEach(() => {
  login.mockReset();
});

describe("Login page", () => {
  it("sets the document title", () => {
    renderLogin();
    expect(document.title).toBe("Đăng nhập · TROSV");
  });

  it("links to the register page", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", "/register");
  });

  it("asks for both fields instead of calling the API", async () => {
    renderLogin();
    await submit();

    expect(screen.getByText("Bạn cần nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Bạn cần nhập mật khẩu.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(banner()).toBeUndefined(); // field errors only, no banner
  });

  it("treats a blank email as missing", async () => {
    renderLogin();
    fill("   ", "secret");
    await submit();

    expect(screen.getByText("Bạn cần nhập email.")).toBeInTheDocument();
    expect(screen.queryByText("Bạn cần nhập mật khẩu.")).not.toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("signs in with the trimmed email and goes home", async () => {
    login.mockResolvedValue(ADA);
    renderLogin();
    fill("  ada@example.com  ", "secret");
    await submit();

    expect(await screen.findByText("trang chủ")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("ada@example.com", "secret");
  });

  it("returns to the page the user was sent away from", async () => {
    login.mockResolvedValue(ADA);
    renderLogin({ from: "/rooms/12" });
    fill("ada@example.com", "secret");
    await submit();

    expect(await screen.findByText("phòng 12")).toBeInTheDocument();
  });

  it("ignores a redirect target that is not a string", async () => {
    login.mockResolvedValue(ADA);
    renderLogin({ from: { pathname: "/rooms/12" } });
    fill("ada@example.com", "secret");
    await submit();

    expect(await screen.findByText("trang chủ")).toBeInTheDocument();
  });

  it("shows the server's message when the credentials are wrong", async () => {
    login.mockRejectedValue(apiError(401, { message: "Email hoặc mật khẩu không đúng." }));
    renderLogin();
    fill("ada@example.com", "wrong");
    await submit();

    await waitFor(() => {
      expect(banner()).toHaveTextContent("Email hoặc mật khẩu không đúng.");
    });
    expect(screen.queryByText("trang chủ")).not.toBeInTheDocument();
  });

  it("re-enables the button after a failure so the user can retry", async () => {
    login.mockRejectedValueOnce(apiError(401, { message: "Sai rồi" })).mockResolvedValueOnce(ADA);
    renderLogin();
    fill("ada@example.com", "wrong");
    await submit();

    await waitFor(() => {
      expect(banner()).toBeDefined();
    });
    const button = screen.getByRole("button", { name: "Đăng nhập" });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    fill("ada@example.com", "right");
    await submit();
    expect(await screen.findByText("trang chủ")).toBeInTheDocument();
    expect(login).toHaveBeenCalledTimes(2);
  });

  it("clears the previous error once the next attempt validates", async () => {
    login.mockRejectedValue(apiError(401, { message: "Sai rồi" }));
    renderLogin();
    fill("ada@example.com", "wrong");
    await submit();
    await waitFor(() => {
      expect(banner()).toBeDefined();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
    });

    fill("", "wrong"); // next attempt is invalid on the client
    await submit();
    expect(banner()).toBeUndefined();
    expect(screen.getByText("Bạn cần nhập email.")).toBeInTheDocument();
  });

  it("falls back to a friendly message for an unknown failure", async () => {
    login.mockRejectedValue("boom");
    renderLogin();
    fill("ada@example.com", "secret");
    await submit();

    await waitFor(() => {
      expect(banner()).toHaveTextContent(
        "Đăng nhập không thành công. Bạn kiểm tra lại email và mật khẩu nhé.",
      );
    });
  });
});
