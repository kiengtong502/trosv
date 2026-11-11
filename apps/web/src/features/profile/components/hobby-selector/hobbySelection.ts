/*
  Pure rules for the hobby picker. A selection is a list of keys; the form
  stores it as one comma separated string.
*/

import { HOBBY_LIST, HOBBY_PICK_MAX, HOBBY_PICK_MIN } from "@/features/profile/lib/hobbies";

const lower = (key: string) => key.toLowerCase();

/** Trim, drop blanks, drop duplicates (first spelling wins). */
export function uniqueKeys(keys: readonly string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.trim()))).filter(Boolean);
}

export const joinKeys = (keys: readonly string[]): string => uniqueKeys(keys).join(",");

export function hasKey(keys: readonly string[], key: string): boolean {
  return keys.some((k) => lower(k) === lower(key));
}

export function removeKey(keys: readonly string[], key: string): string[] {
  return keys.filter((k) => lower(k) !== lower(key));
}

/** Select the key if it is not selected, otherwise deselect it. */
export function toggleKey(keys: readonly string[], key: string): string[] {
  return hasKey(keys, key) ? removeKey(keys, key) : [...keys, key];
}

/**
 * What typing a hobby into "Khác" does. Typing an existing hobby's key or label
 * selects that hobby instead of creating a duplicate; anything else becomes a
 * custom hobby. Blank input and already-selected hobbies change nothing.
 */
export function addTypedHobby(keys: readonly string[], typed: string): string[] {
  const text = typed.trim();
  if (!text) return [...keys];
  const standard = HOBBY_LIST.find(
    (h) => lower(h.key) === lower(text) || lower(h.label) === lower(text),
  );
  const toAdd = standard?.key ?? text;
  return hasKey(keys, toAdd) ? [...keys] : [...keys, toAdd];
}

/** Selected keys that are not in the preset list. */
export function customKeys(keys: readonly string[]): string[] {
  const standard = new Set(HOBBY_LIST.map((h) => lower(h.key)));
  return keys.filter((k) => !standard.has(lower(k)));
}

/** The coaching line under the meter. */
export function statusText(count: number): string {
  if (count < HOBBY_PICK_MIN) return `Chọn thêm ${HOBBY_PICK_MIN - count} sở thích nữa`;
  if (count <= HOBBY_PICK_MAX) return "Vậy là đủ để AI ghép bạn cùng phòng";
  return "Bạn có nhiều sở thích, AI sẽ ưu tiên những điểm chung";
}

/** 0-100: how close the selection is to the minimum the matcher needs. */
export function meterPercent(count: number): number {
  return Math.min(count / HOBBY_PICK_MIN, 1) * 100;
}
