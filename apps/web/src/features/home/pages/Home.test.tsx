import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import type { User } from "@/shared/types/api";
import Home from "./Home";

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../components/TypedWord", () => ({ TypedWord: () => null }));
vi.mock("@/features/listings/api/listingApi", () => ({
  getListings: () => Promise.resolve({ data: [] }),
}));
vi.mock("@/features/listings/hooks/useReferenceData", () => ({
  useCities: () => ({ data: [] }),
  useSchools: () => ({ data: [] }),
}));

beforeEach(() => {
  auth.user = null;
});

it("takes a signed-in landlord straight to the new listing form", async () => {
  auth.user = { id: 1, role: "landlord" } as User;
  await act(async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    await Promise.resolve();
  });
  expect(screen.getByRole("link", { name: "Đăng tin ngay" })).toHaveAttribute(
    "href",
    "/landlord/new",
  );
});

it("takes a guest to registration", async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    await Promise.resolve();
  });
  expect(screen.getByRole("link", { name: "Đăng tin ngay" })).toHaveAttribute("href", "/register");
});
