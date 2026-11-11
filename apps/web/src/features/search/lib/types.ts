import type { useListingSearch } from "@/features/search/hooks/useListingSearch";

/** Everything the search hook returns: filters, setters, reference lists. */
export type SearchState = ReturnType<typeof useListingSearch>;
