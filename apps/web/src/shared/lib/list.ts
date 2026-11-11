/** Add the item if it is missing, remove it if it is present. Never mutates. */
export function toggleId<T>(items: readonly T[], item: T): T[] {
  return items.includes(item) ? items.filter((x) => x !== item) : [...items, item];
}
