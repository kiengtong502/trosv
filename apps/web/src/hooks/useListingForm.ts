import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { NavigateFunction } from "react-router-dom";
import { createListing, updateListing, uploadImages, deleteImage } from "@/api/landlordApi";
import { getListing } from "@/api/listingApi";
import { useAmenities, useCities, useWards } from "@/hooks/useReferenceData";
import { aiDescription } from "@/api/aiApi";
import { errMessage, errFieldErrors } from "@/api/axiosClient";
import { ROUTES, route } from "@/constants/routes";
import type { ListingImage } from "@/types/api";
import {
  EMPTY_FORM,
  buildDescriptionRequest,
  buildListingPayload,
  formFromListing,
  photoLimitError,
  toggleId,
  type ListingFormState,
} from "./listingFormModel";

/** Toast interface du can cua hook - khong toan bo toast context. */
export interface ToastLike {
  success: (msg: string) => unknown;
  error: (msg: string) => unknown;
}

/**
 * Listing create/edit form state and actions for the landlord pages:
 * reference data, edit-mode load, field setters with cascade (city resets
 * ward), ward-centroid memo for the map, AI description generation,
 * image picking/deleting and the final submit payload (create or update,
 * uploading any newly picked images afterwards).
 */
export function useListingForm(id: number | undefined, toast: ToastLike) {
  const isEdit = !!id;

  const { data: wards } = useWards();
  const { data: cities } = useCities();
  const { data: amenities } = useAmenities();
  const [form, setForm] = useState<ListingFormState>({ ...EMPTY_FORM });
  const [images, setImages] = useState<ListingImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getListing(id)
      .then((l) => {
        setForm(formFromListing(l));
        setImages(l.images || []);
      })
      .catch((err: unknown) => {
        setNotice(errMessage(err, "Không tải được tin đăng."));
      });
  }, [id, isEdit]);

  const setField = (key: keyof ListingFormState, value: string): void => {
    setErrors({});
    setForm((f) => ({ ...f, [key]: value }));
  };

  /** onChange handler for a text input, select or textarea bound to `key`. */
  const set =
    (key: keyof ListingFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setField(key, e.target.value);
    };

  /** Choosing another city clears the ward, so the two never disagree. */
  const changeCity = (cityId: string): void => {
    setErrors({});
    setForm((f) => ({ ...f, city_id: cityId, ward_id: "" }));
  };

  /** Stable on purpose: the map effect depends on it and must not restart. */
  const setCoordinates = useCallback((latitude: number, longitude: number): void => {
    setForm((f) => ({ ...f, latitude, longitude }));
  }, []);

  function toggleAmenity(amenityId: number): void {
    setForm((f) => ({ ...f, amenity_ids: toggleId(f.amenity_ids, amenityId) }));
  }

  /** "Viết mô tả giúp tôi" - POST /ai/description (Landlord). */
  async function generateDescription(): Promise<void> {
    setAiBusy(true);
    setNotice("");
    try {
      const { description } = await aiDescription(buildDescriptionRequest(form));
      setForm((f) => ({ ...f, description: description || "" }));
    } catch (err) {
      setNotice(errMessage(err, "AI không tạo được mô tả lúc này."));
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent, navigate: NavigateFunction): Promise<void> {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    setNotice("");

    const payload = buildListingPayload(form, isEdit);

    try {
      if (isEdit) {
        const updated = await updateListing(id, payload);
        // Upload newly picked images, if any.
        if (newFiles.length > 0) {
          await uploadImages(id, newFiles);
        }
        void navigate(route(ROUTES.ROOM_DETAIL, { id: updated.id }));
      } else {
        const created = await createListing(payload);
        // Jump to edit page to upload images for the new listing.
        if (newFiles.length > 0) {
          await uploadImages(created.id, newFiles);
        }
        void navigate(ROUTES.LANDLORD);
      }
    } catch (err: unknown) {
      setErrors(errFieldErrors(err));
      setNotice(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteImage(imageId: number): Promise<void> {
    if (!id || !window.confirm("Xóa ảnh này?")) return;
    try {
      await deleteImage(id, imageId);
      setImages((rows) => rows.filter((i) => i.id !== imageId));
      toast.success("Đã xóa ảnh.");
    } catch (err) {
      toast.error(errMessage(err));
    }
  }

  /** Accepts the picked photos, or explains why not. Returns whether they were accepted. */
  function pickFiles(files: File[]): boolean {
    const limitError = photoLimitError(isEdit, images.length, files.length);
    if (limitError) {
      setNotice(limitError);
      return false;
    }
    setNotice("");
    setNewFiles(files);
    return true;
  }

  function handleFilePick(e: ChangeEvent<HTMLInputElement>): void {
    if (!pickFiles(Array.from(e.target.files || []))) e.target.value = "";
  }

  return {
    isEdit,
    wards,
    cities,
    amenities,
    form,
    set,
    setField,
    changeCity,
    setCoordinates,
    pickFiles,
    images,
    newFiles,
    errors,
    busy,
    aiBusy,
    notice,
    toggleAmenity,
    generateDescription,
    handleSubmit,
    handleDeleteImage,
    handleFilePick,
  };
}
