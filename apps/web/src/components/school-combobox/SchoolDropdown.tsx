import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { School } from "@/types/api";
import { ALL_CITIES, schoolPlace } from "./schoolSearch";

const TAB = "rounded-md px-2.5 py-1 text-xs font-medium transition-colors shrink-0";
const TAB_ON = "bg-plate text-white shadow-xs font-semibold";
const TAB_OFF = "bg-card text-muted hover:text-ink hover:bg-tint border border-line";

export interface SchoolDropdownProps {
  /** Every school (for the per-city counts). */
  schools: School[];
  /** The schools after the search and city filters. */
  results: School[];
  cities: string[];
  city: string;
  query: string;
  selectedId: string;
  onCity: (city: string) => void;
  onPick: (school: School) => void;
  onShowAll: () => void;
  onClose: () => void;
}

function CityTabs({
  schools,
  cities,
  city,
  onCity,
}: Pick<SchoolDropdownProps, "schools" | "cities" | "city" | "onCity">) {
  if (cities.length === 0) return null;
  return (
    <div className="flex items-center gap-1 border-b border-line bg-paper/60 p-2 overflow-x-auto">
      <button
        type="button"
        onClick={() => {
          onCity(ALL_CITIES);
        }}
        className={cn(TAB, city === ALL_CITIES ? TAB_ON : TAB_OFF)}
      >
        Tất cả ({schools.length})
      </button>
      {cities.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            onCity(c);
          }}
          className={cn(TAB, city === c ? TAB_ON : TAB_OFF)}
        >
          {c} ({schools.filter((s) => s.city?.name === c).length})
        </button>
      ))}
    </div>
  );
}

function NoResults({ query, onShowAll }: { query: string; onShowAll: () => void }) {
  return (
    <div className="py-6 text-center text-xs text-muted space-y-2">
      <p>Không tìm thấy trường nào phù hợp với từ khóa &ldquo;{query}&rdquo;</p>
      {query ? (
        <button
          type="button"
          onClick={onShowAll}
          className={
            "inline-flex items-center gap-1 rounded-md border border-line bg-paper " +
            "px-2.5 py-1 text-xs font-medium text-ink hover:bg-tint"
          }
        >
          <RotateCcw className="size-3" aria-hidden />
          <span>Xem tất cả các trường</span>
        </button>
      ) : null}
    </div>
  );
}

/** Floating panel: city tabs, matching schools, and a count footer. */
export function SchoolDropdown(props: SchoolDropdownProps) {
  const { results, query, selectedId, onPick, onShowAll, onClose } = props;
  return (
    <div
      className={
        "absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl border border-line " +
        "bg-card shadow-pop overflow-hidden animate-pop-in"
      }
    >
      <CityTabs {...props} />

      <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
        {results.length === 0 ? (
          <NoResults query={query} onShowAll={onShowAll} />
        ) : (
          results.map((s) => {
            const isSelected = String(s.id) === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onPick(s);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
                  "text-left text-sm transition-colors",
                  isSelected
                    ? "bg-plate-tint/70 text-plate font-semibold"
                    : "text-ink hover:bg-tint",
                )}
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted">{schoolPlace(s)}</p>
                </div>
                {isSelected ? <Check className="size-4 text-plate shrink-0" aria-hidden /> : null}
              </button>
            );
          })
        )}
      </div>

      <div
        className={
          "border-t border-line bg-paper/30 px-3 py-2 text-[11px] text-muted " +
          "flex items-center justify-between"
        }
      >
        <span>Hiển thị {results.length} trường</span>
        <button type="button" onClick={onClose} className="text-plate hover:underline font-medium">
          Đóng
        </button>
      </div>
    </div>
  );
}
