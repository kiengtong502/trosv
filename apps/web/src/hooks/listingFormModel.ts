/*
  Pure model of the landlord listing form: initial values, the request
  payloads, the address-guess rule and the photo limits. No React.
*/

import type { Listing, ListingPayload } from "@/types/api";

export interface ListingFormState {
  title: string;
  type: string;
  price: string | number;
  area_m2: string | number;
  address: string;
  latitude: string | number;
  longitude: string | number;
  city_id: string | number;
  ward_id: string | number;
  description: string;
  amenity_ids: number[];
  status: string;
}

export const EMPTY_FORM: ListingFormState = {
  title: "",
  type: "room",
  price: "",
  area_m2: "",
  address: "",
  latitude: "",
  longitude: "",
  city_id: "",
  ward_id: "",
  description: "",
  amenity_ids: [],
  status: "available",
};

/** Most photos a listing may have. */
export const MAX_PHOTOS = 5;

const orElse = <T, F>(value: T | null | undefined, fallback: F): T | F => value || fallback;
const orBlank = <T>(value: T | null | undefined): T | "" => value ?? "";

/** Form values for editing an existing listing. */
export function formFromListing(l: Listing): ListingFormState {
  return {
    title: orElse(l.title, ""),
    type: orElse(l.type, "room"),
    price: l.price,
    area_m2: orBlank(l.area_m2),
    address: orElse(l.address, ""),
    latitude: orBlank(l.latitude),
    longitude: orBlank(l.longitude),
    city_id: orElse(l.ward?.city?.id, ""),
    ward_id: orElse(l.ward?.id, ""),
    description: orElse(l.description, ""),
    amenity_ids: orElse(
      l.amenities?.map((a) => a.id),
      [],
    ),
    status: orElse(l.status, "available"),
  };
}

/** Body of POST /listings (create) or PUT /listings/{id} (edit adds the status). */
export function buildListingPayload(form: ListingFormState, isEdit: boolean): ListingPayload {
  const payload: ListingPayload = {
    title: form.title,
    type: form.type,
    price: Number(form.price),
    area_m2: Number(form.area_m2),
    address: form.address,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    ward_id: Number(form.ward_id),
    description: form.description || null,
    amenity_ids: form.amenity_ids,
  };
  if (isEdit) payload.status = form.status;
  return payload;
}

/** Body of POST /ai/description: only the fields the landlord has filled in. */
export function buildDescriptionRequest(form: ListingFormState) {
  return {
    title: form.title || undefined,
    type: form.type || undefined,
    price: form.price === "" ? undefined : Number(form.price),
    area_m2: form.area_m2 === "" ? undefined : Number(form.area_m2),
    address: form.address || undefined,
    ward_id: form.ward_id || undefined,
    amenity_ids: form.amenity_ids.length ? form.amenity_ids : undefined,
  };
}

/** Message if picking `picked` more photos would break the limit, else null. */
export function photoLimitError(isEdit: boolean, existing: number, picked: number): string | null {
  if (isEdit && existing + picked > MAX_PHOTOS) return "Tin đăng chỉ có tối đa 5 ảnh.";
  if (!isEdit && picked > MAX_PHOTOS) return "Tối đa 5 ảnh mỗi tin.";
  return null;
}
