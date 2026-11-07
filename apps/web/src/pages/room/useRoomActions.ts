import type { Dispatch, SetStateAction } from "react";
import { addFavorite, removeFavorite } from "@/api/socialApi";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/ui/toast";
import type { Listing } from "@/types/api";

/** Save/un-save (optimistic, rolled back on failure) and copy-link for the room page. */
export function useRoomActions(
  listing: Listing | null,
  setListing: Dispatch<SetStateAction<Listing | null>>,
) {
  const { user } = useAuth();
  const isFavorite = listing?.is_favorited === true;

  async function toggleFavorite(): Promise<void> {
    if (!listing || !user || user.role !== "student") return;
    const next = !isFavorite;
    setListing((l) => (l ? { ...l, is_favorited: next } : l));
    try {
      if (next) {
        await addFavorite(listing.id);
        toast("Đã lưu phòng.");
      } else {
        await removeFavorite(listing.id);
        toast("Đã bỏ lưu phòng.");
      }
    } catch {
      setListing((l) => (l ? { ...l, is_favorited: !next } : l));
      toast("Không cập nhật được yêu thích. Bạn thử lại nhé.");
    }
  }

  function copyLink(): void {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast("Đã sao chép liên kết.");
      })
      .catch(() => {
        toast("Không sao chép được liên kết.");
      });
  }

  return { isFavorite, toggleFavorite, copyLink };
}
