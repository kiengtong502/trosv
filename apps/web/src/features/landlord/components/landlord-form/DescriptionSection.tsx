import { Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import { SECTION, SELECT } from "./styles";
import type { ListingFormApi } from "./types";

const STATUS_OPTIONS = [
  { value: "available", label: "Còn trống" },
  { value: "rented", label: "Đã thuê" },
  { value: "hidden", label: "Ẩn" },
] as const;

/** Description (with the AI writer), amenities and, when editing, the status. */
export function DescriptionSection({ form: f }: { form: ListingFormApi }) {
  return (
    <section className={SECTION}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mô tả</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={f.aiBusy}
          onClick={() => void f.generateDescription()}
        >
          <Sparkles className="size-4" aria-hidden /> Viết mô tả giúp tôi
        </Button>
      </div>
      <Field id="lf-desc" label="Mô tả" hint="Không bắt buộc" error={f.errors["description"]?.[0]}>
        <Textarea
          id="lf-desc"
          rows={5}
          value={f.form.description}
          onChange={f.set("description")}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Tiện ích</legend>
        <div className="flex flex-wrap gap-2">
          {f.amenities.map((a) => {
            const on = f.form.amenity_ids.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  f.toggleAmenity(a.id);
                }}
                aria-pressed={on}
                className={cn(
                  "cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5",
                  "text-xs font-medium transition-colors",
                  on
                    ? "border-plate bg-plate font-semibold text-white shadow-xs"
                    : "border-line-strong bg-card text-ink hover:bg-tint",
                )}
              >
                {a.name ?? `Tiện ích ${a.id}`}
              </button>
            );
          })}
        </div>
      </fieldset>
      {f.isEdit ? (
        <Field id="lf-status" label="Trạng thái">
          <select
            id="lf-status"
            value={f.form.status}
            onChange={f.set("status")}
            className={SELECT}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
    </section>
  );
}
