import api from "@/shared/api/axiosClient";
import { envelope, pagedEnvelope } from "@/shared/api/envelope";
import type { Listing } from "@/shared/types/api";
import type { Paged } from "@/features/listings/api/listingApi";

// API_CONTRACT §4 - "Yêu thích (sinh viên)"
export const getFavorites = (page = 1): Promise<Paged<Listing>> =>
  api.get("/favorites", { params: { page } }).then((r) => {
    const body = pagedEnvelope<Listing>(r);
    return { data: body.data, meta: body.meta };
  });

export const addFavorite = (listingId: number): Promise<unknown> =>
  api.put(`/favorites/${listingId}`).then((r) => envelope<unknown>(r).data);

export const removeFavorite = (listingId: number): Promise<unknown> =>
  api.delete(`/favorites/${listingId}`).then((r) => envelope<unknown>(r).data);
