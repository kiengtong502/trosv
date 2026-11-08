import { MapPin } from "lucide-react";
import { Field } from "@/ui/field";
import { Input } from "@/ui/input";
import { CoordinatePicker } from "./CoordinatePicker";
import { SECTION } from "./styles";
import type { ListingFormApi } from "./types";

/** Map to pick the exact spot, with the two coordinates it fills in. */
export function LocationSection({ form: f }: { form: ListingFormApi }) {
  const err = (field: string): string | undefined => f.errors[field]?.[0];
  return (
    <section className={SECTION}>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <MapPin className="size-5" aria-hidden /> Vị trí trên bản đồ
      </h2>
      <p className="text-sm text-muted">
        Chọn điểm trên bản đồ để điền kinh độ, vĩ độ (dùng khi lọc gần trường).
      </p>
      <div className="h-64 overflow-hidden rounded-xl border border-line">
        <CoordinatePicker lat={f.form.latitude} lng={f.form.longitude} onPick={f.setCoordinates} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="lf-lat" label="Vĩ độ" error={err("latitude")} required>
          <Input
            id="lf-lat"
            type="number"
            step="any"
            value={String(f.form.latitude)}
            onChange={f.set("latitude")}
            className="tabular-nums"
          />
        </Field>
        <Field id="lf-lng" label="Kinh độ" error={err("longitude")} required>
          <Input
            id="lf-lng"
            type="number"
            step="any"
            value={String(f.form.longitude)}
            onChange={f.set("longitude")}
            className="tabular-nums"
          />
        </Field>
      </div>
    </section>
  );
}
