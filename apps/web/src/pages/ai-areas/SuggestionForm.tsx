import { Button } from "@/ui/button";
import { Chip } from "@/ui/badge";
import { Field } from "@/ui/field";
import { PriceRange } from "@/ui/price-range";
import type { School } from "@/types/api";
import type { AreaSuggestions } from "./useAreaSuggestions";

const PRIORITIES = [
  { value: "cheap", label: "Giá rẻ" },
  { value: "near_school", label: "Gần trường" },
  { value: "well_rated", label: "Đánh giá tốt" },
  { value: "many_options", label: "Nhiều lựa chọn" },
] as const;

/** School, monthly budget (two-dot bar) and what matters most. */
export function SuggestionForm({ s, schools }: { s: AreaSuggestions; schools: School[] }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void s.suggest();
      }}
      className="mt-6 flex flex-col gap-4 rounded-xl border border-line bg-card p-6 shadow-xs"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="as-school" label="Trường">
          <select
            id="as-school"
            value={s.schoolId}
            onChange={(e) => {
              s.setSchoolId(e.target.value);
            }}
            className="h-11 w-full rounded-lg border border-line-strong bg-card text-ink px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
          >
            <option value="">Chưa chọn</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium text-ink">Ngân sách mỗi tháng</span>
          <PriceRange id="as-budget" min={s.min} max={s.max} onChange={s.setBudget} />
        </div>
      </div>
      <fieldset className="flex flex-wrap gap-2" aria-label="Ưu tiên">
        {PRIORITIES.map((p) => (
          <Chip
            key={p.value}
            on={s.picks.includes(p.value)}
            onClick={() => {
              s.togglePick(p.value);
            }}
            className="h-9 px-3 text-xs"
          >
            {p.label}
          </Chip>
        ))}
      </fieldset>
      <Button type="submit" variant="primary" loading={s.busy} className="sm:w-fit">
        Gợi ý khu vực
      </Button>
    </form>
  );
}
