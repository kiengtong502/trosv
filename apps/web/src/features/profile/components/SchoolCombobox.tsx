import { useEffect, useMemo, useRef, useState } from "react";
import type { School } from "@/shared/types/api";
import { cn } from "@/shared/lib/utils";
import { SchoolDropdown } from "./school-combobox/SchoolDropdown";
import { SchoolSearchInput } from "./school-combobox/SchoolSearchInput";
import { SchoolTrigger } from "./school-combobox/SchoolTrigger";
import { SelectedSchoolCard } from "./school-combobox/SelectedSchoolCard";
import { ALL_CITIES, cityNames, filterSchools } from "./school-combobox/schoolSearch";

export interface SchoolComboboxProps {
  schools: School[];
  value: string; // school_id as string
  onChange: (id: string) => void;
  error?: string | undefined;
  className?: string | undefined;
}

/** Pick a school by typing (accent-insensitive) or by city tab. */
export function SchoolCombobox({
  schools,
  value,
  onChange,
  error,
  className,
}: SchoolComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(ALL_CITIES);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => (value ? (schools.find((s) => String(s.id) === value) ?? null) : null),
    [schools, value],
  );
  const cities = useMemo(() => cityNames(schools), [schools]);
  const results = useMemo(() => filterSchools(schools, query, city), [schools, query, city]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const openPicker = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {open ? (
        <SchoolSearchInput inputRef={inputRef} query={query} onQueryChange={setQuery} />
      ) : selected ? (
        <SelectedSchoolCard
          school={selected}
          onChange={openPicker}
          onClear={() => {
            onChange("");
            setQuery("");
          }}
        />
      ) : (
        <SchoolTrigger hasError={Boolean(error)} onOpen={openPicker} />
      )}

      {open ? (
        <SchoolDropdown
          schools={schools}
          results={results}
          cities={cities}
          city={city}
          query={query}
          selectedId={value}
          onCity={setCity}
          onPick={(school) => {
            onChange(String(school.id));
            setOpen(false);
            setQuery("");
          }}
          onShowAll={() => {
            setQuery("");
            setCity(ALL_CITIES);
          }}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
