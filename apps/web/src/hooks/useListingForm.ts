import { useEffect, useMemo, useState } from "react";
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
  decideAddressGuess,
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

  const set =
    (key: keyof ListingFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setErrors({});
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  /**
   * Reverse-geocoded street guess from the map (Nominatim).
   * Autofills the address when empty; asks before overwriting one.
   * (No window.confirm inside the state updater: updaters must stay
   * pure - StrictMode calls them twice, which would double the dialog.)
   */
  function applyAddressGuess(street: string): void {
    const wardName = wards.find((x) => String(x.id) === String(form.ward_id))?.name || "";
    const guess = decideAddressGuess(form.address, street, wardName);
    if (guess.action === "fill") {
      setForm((f) => ({ ...f, address: guess.address }));
    } else if (
      guess.action === "ask" &&
      window.confirm(
        `Địa chỉ trên bản đồ: "${guess.address}".\nDùng địa chỉ này thay cho "${guess.current}"?`,
      )
    ) {
      setForm((f) => ({ ...f, address: guess.address }));
    }
  }

  // Recentre the coordinate picker on the selected ward's centroid.
  const wardCenter = useMemo<[number, number] | undefined>(() => {
    const w = wards.find((x) => String(x.id) === String(form.ward_id));
    const lat = w?.latitude;
    const lng = w?.longitude;
    if (lat == null || lng == null) return undefined;
    return [lat, lng];
  }, [wards, form.ward_id]);

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

  function handleFilePick(e: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files || []);
    const limitError = photoLimitError(isEdit, images.length, files.length);
    if (limitError) {
      setNotice(limitError);
      e.target.value = "";
      return;
    }
    setNotice("");
    setNewFiles(files);
  }

  return {
    isEdit,
    wards,
    cities,
    amenities,
    form,
    set,
    setForm,
    images,
    newFiles,
    errors,
    busy,
    aiBusy,
    notice,
    wardCenter,
    applyAddressGuess,
    toggleAmenity,
    generateDescription,
    handleSubmit,
    handleDeleteImage,
    handleFilePick,
  };
}
