import type { School } from "@/types/api";
import { Field } from "@/ui/field";
import { PriceRange } from "@/ui/price-range";
import { SchoolCombobox } from "@/components/SchoolCombobox";

interface ProfileAcademicCardProps {
  schools: School[];
  schoolId: string;
  budgetMin: string;
  budgetMax: string;
  budgetHint?: string;
  onChange: (key: "school_id" | "budget_min" | "budget_max", value: string) => void;
  errors: {
    school_id?: string | undefined;
    budget_min?: string | undefined;
    budget_max?: string | undefined;
  };
}

export function ProfileAcademicCard({
  schools,
  schoolId,
  budgetMin,
  budgetMax,
  budgetHint,
  onChange,
  errors,
}: ProfileAcademicCardProps) {
  return (
    <div className="space-y-4">
      <Field
        id="p-school"
        label="Trường Đại học / Cao đẳng"
        hint="Tìm theo tên trường, viết tắt (VD: Bách Khoa, UET...) hoặc chọn theo khu vực"
        error={errors.school_id}
      >
        <SchoolCombobox
          schools={schools}
          value={schoolId}
          onChange={(id) => {
            onChange("school_id", id);
          }}
          error={errors.school_id}
        />
      </Field>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink">Ngân sách mỗi tháng</span>
        <PriceRange
          id="p-budget"
          min={budgetMin}
          max={budgetMax}
          onChange={(lo, hi) => {
            onChange("budget_min", lo);
            onChange("budget_max", hi);
          }}
        />
        {budgetHint ? (
          <p className="mt-2 text-xs text-muted">
            Khoảng dự kiến: <span className="font-semibold text-ink">{budgetHint}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
