import type { useListingSearch } from "@/hooks/useListingSearch";

/** Everything the search hook returns: filters, setters, reference lists. */
export type SearchState = ReturnType<typeof useListingSearch>;
