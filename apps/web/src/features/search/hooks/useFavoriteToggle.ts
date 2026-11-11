import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { addFavorite, removeFavorite } from "@/features/listings/api/favoritesApi";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/ui/toast";
import type { Listing } from "@/shared/types/api";

/** Heart button on a result card: guests go to login, landlords are told no, students toggle (optimistic). */
export function useFavoriteToggle(setListings: Dispatch<SetStateAction<Listing[]>>) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const mark = (id: number, isFavorited: boolean) => {
    setListings((rows) => rows.map((r) => (r.id === id ? { ...r, is_favorited: isFavorited } : r)));
  };

  return async function toggleFavorite(listing: Listing): Promise<void> {
    if (!user) {
      toast("Vui lòng đăng nhập bằng tài khoản sinh viên để lưu phòng.");
      void navigate(ROUTES.LOGIN);
      return;
    }
    if (user.role !== "student") {
      toast("Chức năng lưu phòng chỉ dành cho tài khoản sinh viên.");
      return;
    }
    const wasFavorite = listing.is_favorited === true;
    mark(listing.id, !wasFavorite);
    try {
      if (wasFavorite) {
        await removeFavorite(listing.id);
        toast("Đã bỏ lưu phòng.");
      } else {
        await addFavorite(listing.id);
        toast("Đã lưu phòng.");
      }
    } catch {
      mark(listing.id, wasFavorite);
      toast("Không cập nhật được yêu thích. Bạn thử lại nhé.");
    }
  };
}
