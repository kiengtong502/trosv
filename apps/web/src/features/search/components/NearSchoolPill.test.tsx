import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NearSchoolPill } from "./NearSchoolPill";
import { EMPTY_FILTERS } from "../lib/searchFilters";
import type { SearchState } from "../lib/types";

function createMockSearchState(overrides: Partial<SearchState> = {}): SearchState {
  return {
    cities: [
      { id: 1, name: "TP.HCM" },
      { id: 2, name: "Hà Nội" },
      { id: 3, name: "Đà Nẵng" },
    ],
    wards: [
      { id: 10, name: "Phường Bến Nghé", city: { id: 1, name: "TP.HCM" } },
      { id: 20, name: "Phường Dịch Vọng Hậu", city: { id: 2, name: "Hà Nội" } },
    ],
    schools: [
      {
        id: 100,
        name: "ĐH Bách Khoa HCM",
        city: { id: 1, name: "TP.HCM" },
        ward: { id: 10, name: "Phường Bến Nghé" },
      },
      {
        id: 200,
        name: "ĐH Quốc Gia Hà Nội",
        city: { id: 2, name: "Hà Nội" },
        ward: { id: 20, name: "Phường Dịch Vọng Hậu" },
      },
    ],
    amenities: [],
    filters: { ...EMPTY_FILTERS },
    setFilter: vi.fn(),
    setCity: vi.fn(),
    setWard: vi.fn(),
    toggleAmenity: vi.fn(),
    resetFilters: vi.fn(),
    listings: [],
    mapListings: [],
    setListings: vi.fn(),
    meta: null,
    loading: false,
    error: "",
    page: 1,
    setPage: vi.fn(),
    ...overrides,
  };
}

describe("NearSchoolPill", () => {
  it("locks school selector when no city is selected", () => {
    const search = createMockSearchState({
      filters: { ...EMPTY_FILTERS, city_id: "" },
    });

    render(<NearSchoolPill search={search} />);

    // Open filter pill
    fireEvent.click(screen.getByRole("button", { name: "Gần trường" }));

    const schoolSelect = screen.getByLabelText("Trường đại học");
    expect(schoolSelect).toBeDisabled();
    expect(schoolSelect).toHaveTextContent("Chọn Tỉnh/TP trước");
  });

  it("unlocks school selector and lists schools when city is selected", () => {
    const search = createMockSearchState({
      filters: { ...EMPTY_FILTERS, city_id: "2" },
    });

    render(<NearSchoolPill search={search} />);

    fireEvent.click(screen.getByRole("button", { name: "Gần trường" }));

    const schoolSelect = screen.getByLabelText("Trường đại học");
    expect(schoolSelect).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Chọn trường" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ĐH Quốc Gia Hà Nội" })).toBeInTheDocument();
    // School from another city should not be listed
    expect(screen.queryByRole("option", { name: "ĐH Bách Khoa HCM" })).not.toBeInTheDocument();
  });

  it("calls setCity when user changes province/city", () => {
    const search = createMockSearchState();

    render(<NearSchoolPill search={search} />);
    fireEvent.click(screen.getByRole("button", { name: "Gần trường" }));

    const citySelect = screen.getByLabelText("Tỉnh / Thành phố");
    fireEvent.change(citySelect, { target: { value: "2" } });

    expect(search.setCity).toHaveBeenCalledWith("2");
  });

  it("calls setFilter with school_id when school is selected", () => {
    const search = createMockSearchState({
      filters: { ...EMPTY_FILTERS, city_id: "1" },
    });

    render(<NearSchoolPill search={search} />);
    fireEvent.click(screen.getByRole("button", { name: "Gần trường" }));

    const schoolSelect = screen.getByLabelText("Trường đại học");
    fireEvent.change(schoolSelect, { target: { value: "100" } });

    expect(search.setFilter).toHaveBeenCalledWith("school_id", "100");
  });

  it("displays radius selector when a school is selected", () => {
    const search = createMockSearchState({
      filters: { ...EMPTY_FILTERS, city_id: "1", school_id: "100" },
    });

    render(<NearSchoolPill search={search} />);
    fireEvent.click(screen.getByRole("button", { name: "Gần trường" }));

    const radiusSelect = screen.getByLabelText("Bán kính");
    expect(radiusSelect).toBeInTheDocument();

    fireEvent.change(radiusSelect, { target: { value: "2" } });
    expect(search.setFilter).toHaveBeenCalledWith("max_km", "2");
  });
});
