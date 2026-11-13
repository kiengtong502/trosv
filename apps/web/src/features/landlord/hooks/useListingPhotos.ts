import { useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { deleteImage } from "@/features/landlord/api/landlordApi";
import { errMessage } from "@/shared/api/axiosClient";
import type { ListingImage } from "@/shared/types/api";
import { photoLimitError } from "../lib/listingFormModel";

export interface ToastLike {
  success: (msg: string) => unknown;
  error: (msg: string) => unknown;
}

export function useListingPhotos(
  id: number | undefined,
  toast: ToastLike,
  setNotice: Dispatch<SetStateAction<string>>,
) {
  const [images, setImages] = useState<ListingImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  async function handleDeleteImage(imageId: number): Promise<void> {
    if (!id || !window.confirm("Xóa ảnh này?")) return;
    try {
      await deleteImage(id, imageId);
      setImages((rows) => rows.filter((image) => image.id !== imageId));
      toast.success("Đã xóa ảnh.");
    } catch (err) {
      toast.error(errMessage(err));
    }
  }

  function pickFiles(files: File[]): boolean {
    const selected = [...newFiles, ...files];
    const error = photoLimitError(!!id, images.length, selected.length);
    if (error) {
      setNotice(error);
      return false;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setNotice("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
      return false;
    }
    if (files.some((file) => file.size > 2 * 1024 * 1024)) {
      setNotice("Mỗi ảnh có dung lượng tối đa 2 MB.");
      return false;
    }
    setNotice("");
    setNewFiles(selected);
    return true;
  }

  function handleFilePick(e: ChangeEvent<HTMLInputElement>): void {
    pickFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  function removeNewFile(index: number): void {
    setNewFiles((files) => files.filter((_, i) => i !== index));
    setNotice("");
  }

  return {
    images,
    setImages,
    newFiles,
    pickFiles,
    handleFilePick,
    handleDeleteImage,
    removeNewFile,
  };
}
