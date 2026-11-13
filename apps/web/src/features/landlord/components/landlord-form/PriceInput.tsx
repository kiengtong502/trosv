import { Input } from "@/shared/ui/input";

export function PriceInput({
  value,
  onChange,
}: {
  value: string | number;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      id="lf-price"
      type="number"
      min={100_000}
      max={100_000_000}
      step={100_000}
      value={String(value)}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      placeholder="2500000"
      className="tabular-nums"
    />
  );
}
