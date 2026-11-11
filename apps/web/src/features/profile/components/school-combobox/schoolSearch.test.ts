import { describe, expect, it } from "vitest";
import type { School } from "@/shared/types/api";
import { ALL_CITIES, cityNames, filterSchools, normalizeVi, schoolPlace } from "./schoolSearch";

const school = (id: number, name: string, city?: string, ward?: string): School =>
  ({
    id,
    name,
    city: city ? { id, name: city } : null,
    ward: ward ? { id, name: ward } : null,
  }) as unknown as School;

const SCHOOLS = [
  school(1, "Đại học Bách Khoa Hà Nội", "Hà Nội", "Hai Bà Trưng"),
  school(2, "ĐH Công nghệ UET", "Hà Nội"),
  school(3, "ĐH Kinh tế TP.HCM (UEH)", "TP.HCM", "Quận 3"),
  school(4, "Trường chưa rõ thành phố"),
];

describe("normalizeVi", () => {
  it.each([
    ["Bách Khoa", "bach khoa"],
    ["ĐẠI HỌC", "dai hoc"],
    ["đ", "d"],
    ["Nguyễn Tất Thành", "nguyen tat thanh"],
    ["already plain", "already plain"],
    ["", ""],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeVi(input)).toBe(expected);
  });
});

describe("cityNames", () => {
  it("lists each city once, in first-seen order, skipping schools without one", () => {
    expect(cityNames(SCHOOLS)).toEqual(["Hà Nội", "TP.HCM"]);
  });

  it("is empty when no school has a city", () => {
    expect(cityNames([school(9, "X")])).toEqual([]);
  });
});

describe("filterSchools", () => {
  const names = (rows: School[]) => rows.map((s) => s.id);

  it("returns everything for an empty query on the all tab", () => {
    expect(names(filterSchools(SCHOOLS, "", ALL_CITIES))).toEqual([1, 2, 3, 4]);
  });

  it("finds a school without typing accents", () => {
    expect(names(filterSchools(SCHOOLS, "bach khoa", ALL_CITIES))).toEqual([1]);
  });

  it("matches abbreviations that are part of the name, case-insensitively", () => {
    expect(names(filterSchools(SCHOOLS, "ueh", ALL_CITIES))).toEqual([3]);
    expect(names(filterSchools(SCHOOLS, "UET", ALL_CITIES))).toEqual([2]);
  });

  it("ignores surrounding spaces in the query", () => {
    expect(names(filterSchools(SCHOOLS, "  uet  ", ALL_CITIES))).toEqual([2]);
  });

  it("limits to the chosen city tab", () => {
    expect(names(filterSchools(SCHOOLS, "", "Hà Nội"))).toEqual([1, 2]);
    expect(names(filterSchools(SCHOOLS, "dai hoc", "TP.HCM"))).toEqual([]);
  });

  it("combines the city tab and the query", () => {
    expect(names(filterSchools(SCHOOLS, "cong nghe", "Hà Nội"))).toEqual([2]);
  });

  it("a school with no city only shows on the all tab", () => {
    expect(names(filterSchools(SCHOOLS, "chua ro", ALL_CITIES))).toEqual([4]);
    expect(names(filterSchools(SCHOOLS, "chua ro", "Hà Nội"))).toEqual([]);
  });
});

describe("schoolPlace", () => {
  it("joins city and ward", () => {
    expect(schoolPlace(SCHOOLS[0] as School)).toBe("Hà Nội · Hai Bà Trưng");
  });

  it("shows the city alone when there is no ward", () => {
    expect(schoolPlace(SCHOOLS[1] as School)).toBe("Hà Nội");
  });

  it("uses the fallback when the city is missing", () => {
    expect(schoolPlace(SCHOOLS[3] as School, "Đại học / Cao đẳng")).toBe("Đại học / Cao đẳng");
    expect(schoolPlace(SCHOOLS[3] as School)).toBe("");
  });
});
