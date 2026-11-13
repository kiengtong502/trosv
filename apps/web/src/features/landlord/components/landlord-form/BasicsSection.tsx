import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { SELECT, SECTION } from "./styles";
import type { ListingFormApi } from "./types";
import { PriceInput } from "./PriceInput";

const TYPE_OPTIONS = [
  { value: "room", label: "Phòng trọ" },
  { value: "apartment", label: "Căn hộ" },
  { value: "house", label: "Nhà nguyên căn" },
] as const;

/** Title, type, price, area, city/ward cascade and street address. */
export function BasicsSection({ form: f }: { form: ListingFormApi }) {
  const err = (field: string): string | undefined => f.errors[field]?.[0];
  const cityId = String(f.form.city_id);
  const wards = f.wards.filter((w) => String(w.city?.id ?? w.city_id) === cityId);

  return (
    <section className={SECTION}>
      <h2 className="text-xl font-semibold">Thông tin chính</h2>
      <Field id="lf-title" label="Tiêu đề" hint="5–200 ký tự" error={err("title")} required>
        <Input id="lf-title" value={f.form.title} onChange={f.set("title")} maxLength={200} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="lf-type" label="Loại tin" error={err("type")} required>
          <select id="lf-type" value={f.form.type} onChange={f.set("type")} className={SELECT}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="lf-price" label="Giá mỗi tháng (VND)" error={err("price")} required>
          <PriceInput
            value={f.form.price}
            onChange={(value) => {
              f.setField("price", value);
            }}
          />
        </Field>
        <Field id="lf-area" label="Diện tích (m²)" error={err("area_m2")} required>
          <Input
            id="lf-area"
            type="number"
            min={5}
            max={1000}
            value={String(f.form.area_m2)}
            onChange={f.set("area_m2")}
            className="tabular-nums"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="lf-city" label="Tỉnh/thành phố" error={err("city_id")} required>
          <select
            id="lf-city"
            required
            value={cityId}
            onChange={(e) => {
              f.changeCity(e.target.value);
            }}
            className={SELECT}
          >
            <option value="">Chọn tỉnh/thành phố</option>
            {f.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="lf-ward" label="Phường/xã" error={err("ward_id")} required>
          <select
            id="lf-ward"
            required
            value={String(f.form.ward_id)}
            onChange={f.set("ward_id")}
            className={SELECT}
            disabled={!f.form.city_id}
          >
            <option value="">{f.form.city_id ? "Chọn phường" : "Chọn tỉnh/TP trước"}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="lf-street" label="Số nhà, tên đường" required>
        <Input
          id="lf-street"
          value={f.form.street_address}
          onChange={f.set("street_address")}
          placeholder="12 Đường số 5"
          maxLength={250}
          required
        />
      </Field>
      <Field id="lf-address" label="Địa chỉ đầy đủ (tự động)" error={err("address")}>
        <Input
          id="lf-address"
          value={f.form.address}
          readOnly
          className="bg-tint text-ink-2"
          placeholder="Nhập số nhà, tên đường và chọn khu vực ở trên"
        />
      </Field>
    </section>
  );
}
