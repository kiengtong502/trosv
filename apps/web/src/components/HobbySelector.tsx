import { parseHobbies } from "@/constants/hobbies";
import { cn } from "@/lib/utils";
import { AddCustomHobby } from "./hobby-selector/AddCustomHobby";
import { CustomHobbies } from "./hobby-selector/CustomHobbies";
import { HobbyGroups } from "./hobby-selector/HobbyGroups";
import { HobbyMeter } from "./hobby-selector/HobbyMeter";
import {
  addTypedHobby,
  customKeys,
  hasKey,
  joinKeys,
  removeKey,
  toggleKey,
} from "./hobby-selector/hobbySelection";

/*
  Hobby picker. Chips are grouped by category, one icon each (a single
  consistent set), at least 44px tall. A hint says how many to pick and why;
  a meter shows when there is enough for the AI roommate matcher. Custom
  hobbies live behind a "+ Khác" chip. `value` stays a comma-separated string.
*/

export interface HobbySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function HobbySelector({
  value,
  onChange,
  className,
  disabled = false,
}: HobbySelectorProps) {
  const selected = parseHobbies(value);
  const keys = selected.map((h) => h.key);
  const custom = customKeys(keys);

  const commit = (next: readonly string[]) => {
    onChange(joinKeys(next));
  };

  return (
    <div data-testid="hobby-picker" className={cn("space-y-5", className)}>
      <HobbyMeter
        count={selected.length}
        canClear={selected.length > 0 && !disabled}
        onClear={() => {
          onChange("");
        }}
      />

      <HobbyGroups
        selectedKeys={keys}
        disabled={disabled}
        onToggle={(key) => {
          if (!disabled) commit(toggleKey(keys, key));
        }}
      />

      <CustomHobbies
        hobbies={selected.filter((h) => hasKey(custom, h.key))}
        disabled={disabled}
        onRemove={(key) => {
          commit(removeKey(keys, key));
        }}
      />

      {disabled ? null : (
        <AddCustomHobby
          onAdd={(typed) => {
            commit(addTypedHobby(keys, typed));
          }}
        />
      )}
    </div>
  );
}
