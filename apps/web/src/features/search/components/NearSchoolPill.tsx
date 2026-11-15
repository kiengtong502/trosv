import { FilterPill } from "./FilterPill";
import { SELECT_FIELD_CLASS } from "./LocationSelects";
import { Input } from "@/shared/ui/input";
import {
  ALL_CITIES,
  filterSchools,
} from "@/features/profile/components/school-combobox/schoolSearch";
import type { SearchState } from "../lib/types";

export const RADIUS_OPTIONS = [
  { value: "1", label: "Trong 1 km" },
  { value: "2", label: "Trong 2 km" },
  { value: "3", label: "Trong 3 km" },
  { value: "5", label: "Trong 5 km" },
] as const;

const LABEL_CLASS = "flex flex-col gap-1 text-xs font-medium text-ink-2";

/** Pick a school directly by name; the room's ward stays independent. */
export function NearSchoolPill({ search }: { search: SearchState }) {
  const { school_id: schoolId, max_km: maxKm } = search.filters;
  const schools = filterSchools(search.schools, search.schoolQuery, ALL_CITIES);
  // Keep the active selection visible while looking for a different school.
  const options =
    search.selectedSchool && !schools.some((school) => school.id === search.selectedSchool?.id)
      ? [search.selectedSchool, ...schools]
      : schools;

  return (
    <FilterPill
      label="Chọn trường"
      active={schoolId !== "" || maxKm !== ""}
      onClear={() => {
        search.setFilter("school_id", "");
      }}
    >
      <div className="flex flex-col gap-3 min-w-[250px]">
        <label htmlFor="filter-school-query" className={LABEL_CLASS}>
          Tìm theo tên trường
          <Input
            id="filter-school-query"
            value={search.schoolQuery}
            onChange={(e) => {
              search.setSchoolQuery(e.target.value);
            }}
            placeholder="Ví dụ: Bách khoa"
          />
        </label>

        <div>
          <label htmlFor="filter-school" className={LABEL_CLASS}>
            Trường đại học
            <select
              id="filter-school"
              value={schoolId}
              onChange={(e) => {
                search.setFilter("school_id", e.target.value);
              }}
              disabled={search.schools.length === 0}
              className={SELECT_FIELD_CLASS}
            >
              <option value="">Chọn trường</option>
              {options.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {schools.length === 0 && search.schoolQuery.trim() !== "" ? (
          <p role="status" className="text-xs text-muted">
            Không tìm thấy trường phù hợp.
          </p>
        ) : null}

        {schoolId !== "" ? (
          <label htmlFor="filter-radius" className={LABEL_CLASS}>
            Bán kính
            <select
              id="filter-radius"
              value={maxKm}
              onChange={(e) => {
                search.setFilter("max_km", e.target.value);
              }}
              className={SELECT_FIELD_CLASS}
            >
              <option value="">Mọi khoảng cách</option>
              {RADIUS_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </FilterPill>
  );
}
