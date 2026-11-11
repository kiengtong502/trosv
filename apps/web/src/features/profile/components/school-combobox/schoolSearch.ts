/*
  Pure search rules for the school picker: Vietnamese-insensitive matching
  ("bach khoa" finds "Bách Khoa") and per-city filtering. No React.
*/

import type { School } from "@/shared/types/api";

/** Lower-case, strip accents, and fold đ -> d, so users can type without diacritics. */
export function normalizeVi(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
}

/** Distinct city names that have at least one school, in first-seen order. */
export function cityNames(schools: readonly School[]): string[] {
  return Array.from(
    new Set(schools.map((s) => s.city?.name).filter((name): name is string => Boolean(name))),
  );
}

export const ALL_CITIES = "all";

/** Schools of one city tab (or all) whose name contains the query. */
export function filterSchools(schools: readonly School[], query: string, city: string): School[] {
  const q = normalizeVi(query.trim());
  return schools.filter((s) => {
    if (city !== ALL_CITIES && s.city?.name !== city) return false;
    return !q || normalizeVi(s.name).includes(q);
  });
}

/** "Hà Nội · Cầu Giấy" under a school name; either part may be missing. */
export function schoolPlace(school: School, fallback = ""): string {
  const city = school.city?.name ?? fallback;
  return school.ward?.name ? `${city} · ${school.ward.name}` : city;
}
