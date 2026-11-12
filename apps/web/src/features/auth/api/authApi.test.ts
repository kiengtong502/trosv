import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthResponse, RegisterPayload, User } from "@/shared/types/api";
import { login, logout, me, register, updateProfile } from "./authApi";

const http = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), put: vi.fn() }));
vi.mock("@/shared/api/axiosClient", () => ({ default: http }));

const USER = { id: 7, name: "An", email: "an@example.com", role: "student" } as User;
const AUTH: AuthResponse = { token: "tok", user: USER };

/** What axios resolves with: the backend envelope sits under `.data`. */
const reply = <T>(data: T) => ({ data: { data } });

beforeEach(() => {
  http.post.mockReset();
  http.get.mockReset();
  http.put.mockReset();
});

describe("authApi", () => {
  it("login posts the credentials and unwraps the envelope", async () => {
    http.post.mockResolvedValue(reply(AUTH));
    await expect(login("an@example.com", "secret")).resolves.toEqual(AUTH);
    expect(http.post).toHaveBeenCalledWith("/login", {
      email: "an@example.com",
      password: "secret",
    });
  });

  it("register posts the whole payload", async () => {
    const payload: RegisterPayload = {
      name: "An",
      email: "an@example.com",
      password: "password1",
      password_confirmation: "password1",
      role: "landlord",
    };
    http.post.mockResolvedValue(reply(AUTH));
    await expect(register(payload)).resolves.toEqual(AUTH);
    expect(http.post).toHaveBeenCalledWith("/register", payload);
  });

  it("logout posts and returns whatever the server sent", async () => {
    http.post.mockResolvedValue({ status: 204 });
    await expect(logout()).resolves.toEqual({ status: 204 });
    expect(http.post).toHaveBeenCalledWith("/logout");
  });

  it("me reads the current user", async () => {
    http.get.mockResolvedValue(reply(USER));
    await expect(me()).resolves.toEqual(USER);
    expect(http.get).toHaveBeenCalledWith("/me");
  });

  it("updateProfile puts the partial user", async () => {
    http.put.mockResolvedValue(reply({ ...USER, name: "Bình" }));
    await expect(updateProfile({ name: "Bình" })).resolves.toMatchObject({ name: "Bình" });
    expect(http.put).toHaveBeenCalledWith("/profile", { name: "Bình" });
  });

  it("an empty body is an error, not undefined data", async () => {
    http.get.mockResolvedValue({ data: undefined });
    await expect(me()).rejects.toThrow("Phản hồi rỗng từ máy chủ.");
  });

  it("network errors propagate untouched", async () => {
    const failure = new Error("Network Error");
    http.post.mockRejectedValue(failure);
    await expect(login("a@b.c", "x")).rejects.toBe(failure);
  });
});
