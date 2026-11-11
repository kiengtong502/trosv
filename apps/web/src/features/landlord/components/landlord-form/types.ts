import type { useListingForm } from "@/features/landlord/hooks/useListingForm";

/** Everything the listing-form hook returns: values, setters, reference lists, actions. */
export type ListingFormApi = ReturnType<typeof useListingForm>;
