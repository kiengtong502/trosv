import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOKEN_KEY } from "@/shared/constants/storage";
import type { RegisterPayload, User } from "@/shared/types/api";
import { AuthProvider, useAuth } from "./AuthContext";

const api = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}));
vi.mock("@/features/auth/api/authApi", () => api);

const ADA = { id: 1, name: "Ada", email: "ada@example.com", role: "student" } as User;
const BOB = { id: 2, name: "Bob", email: "bob@example.com", role: "landlord" } as User;

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const mount = () => renderHook(() => useAuth(), { wrapper });

function signIn(user: User = ADA): void {
  localStorage.setItem(TOKEN_KEY, "tok");
  localStorage.setItem("user", JSON.stringify(user));
}

beforeEach(() => {
  localStorage.clear();
  Object.values(api).forEach((fn) => {
    fn.mockReset();
  });
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("AuthProvider: initial state", () => {
  it("starts signed out without a token and never calls the API", () => {
    const { result } = mount();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(api.me).not.toHaveBeenCalled();
  });

  it("drops a stored user that has no token (stale data after a reseed or a 401)", () => {
    localStorage.setItem("user", JSON.stringify(ADA));
    const { result } = mount();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("shows the stored user immediately, then refreshes it from the server", async () => {
    signIn(ADA);
    api.me.mockResolvedValue({ ...ADA, name: "Ada Lovelace" });
    const { result } = mount();

    expect(result.current.user).toEqual(ADA);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user?.name).toBe("Ada Lovelace");
    expect(JSON.parse(localStorage.getItem("user") ?? "{}")).toMatchObject({
      name: "Ada Lovelace",
    });
  });

  it("keeps the stored user when the refresh fails, and logs it", async () => {
    signIn(ADA);
    api.me.mockRejectedValue(new Error("offline"));
    const { result } = mount();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(ADA);
    expect(console.warn).toHaveBeenCalled();
  });

  it("ignores a corrupt stored user", () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    localStorage.setItem("user", "{not json");
    api.me.mockReturnValue(new Promise(() => undefined));
    const { result } = mount();
    expect(result.current.user).toBeNull();
  });
});

describe("AuthProvider: actions", () => {
  it("login stores the token and user, and returns the user", async () => {
    api.login.mockResolvedValue({ token: "abc", user: BOB });
    const { result } = mount();

    let returned: User | undefined;
    await act(async () => {
      returned = await result.current.login("bob@example.com", "pw");
    });

    expect(api.login).toHaveBeenCalledWith("bob@example.com", "pw");
    expect(returned).toEqual(BOB);
    expect(result.current.user).toEqual(BOB);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("abc");
    expect(JSON.parse(localStorage.getItem("user") ?? "{}")).toEqual(BOB);
  });

  it("a failed login stores nothing and rethrows", async () => {
    const failure = new Error("Sai mật khẩu");
    api.login.mockRejectedValue(failure);
    const { result } = mount();

    await act(async () => {
      await expect(result.current.login("a@b.c", "bad")).rejects.toBe(failure);
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("register stores the new session", async () => {
    const payload: RegisterPayload = {
      name: "Bob",
      email: "bob@example.com",
      password: "password1",
      password_confirmation: "password1",
      role: "landlord",
    };
    api.register.mockResolvedValue({ token: "new", user: BOB });
    const { result } = mount();

    await act(async () => {
      await result.current.register(payload);
    });

    expect(api.register).toHaveBeenCalledWith(payload);
    expect(result.current.user).toEqual(BOB);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("new");
  });

  it("logout clears the session", async () => {
    signIn(ADA);
    api.me.mockResolvedValue(ADA);
    api.logout.mockResolvedValue({});
    const { result } = mount();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("logout still signs out locally when the server call fails (token already invalid)", async () => {
    signIn(ADA);
    api.me.mockResolvedValue(ADA);
    api.logout.mockRejectedValue(new Error("401"));
    const { result } = mount();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("refreshUser replaces the user and the stored copy", async () => {
    const { result } = mount();
    api.me.mockResolvedValue(BOB);

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(BOB);
    expect(JSON.parse(localStorage.getItem("user") ?? "{}")).toEqual(BOB);
  });
});

describe("useAuth", () => {
  it("refuses to run outside an AuthProvider", () => {
    // React also reports the (intentional) error through window's error event.
    const swallow = (event: ErrorEvent) => {
      event.preventDefault();
    };
    window.addEventListener("error", swallow);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
    } finally {
      window.removeEventListener("error", swallow);
    }
  });
});
