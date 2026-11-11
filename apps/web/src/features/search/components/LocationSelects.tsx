import { wardPlaceholder, wardsInCity } from "../lib/locationOptions";
import type { SearchState } from "../lib/types";

export const SELECT_FIELD_CLASS =
  "h-10 rounded-lg border border-line-strong bg-card px-3 text-sm text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate disabled:opacity-50";

const LABEL_CLASS = "flex flex-col gap-1 text-xs font-medium text-ink-2";

/** Province/city and ward selects; the ward list follows the chosen city. */
export function LocationSelects({
  idPrefix,
  search,
  cityAllLabel = "Tất cả",
}: {
  idPrefix: string;
  search: SearchState;
  cityAllLabel?: string;
}) {
  const { city_id: cityId, ward_id: wardId } = search.filters;
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-city`} className={LABEL_CLASS}>
          Tỉnh / Thành phố
          <select
            id={`${idPrefix}-city`}
            value={cityId}
            onChange={(e) => {
              search.setCity(e.target.value);
            }}
            className={SELECT_FIELD_CLASS}
          >
            <option value="">{cityAllLabel}</option>
            {search.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-ward`} className={LABEL_CLASS}>
          Phường / Xã
          <select
            id={`${idPrefix}-ward`}
            value={wardId}
            onChange={(e) => {
              search.setWard(e.target.value);
            }}
            disabled={cityId === ""}
            className={SELECT_FIELD_CLASS}
          >
            <option value="">{wardPlaceholder(cityId)}</option>
            {wardsInCity(search.wards, cityId).map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
