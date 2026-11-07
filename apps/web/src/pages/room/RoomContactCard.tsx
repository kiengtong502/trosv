import { useNavigate } from "react-router-dom";
import { ROUTES, route } from "@/constants/routes";
import { startConversation } from "@/api/socialApi";
import { Button } from "@/ui/button";
import { toast } from "@/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone } from "lucide-react";
import type { Listing } from "@/types/api";
import { formatPriceShort } from "@/lib/format";

export interface RoomContactCardProps {
  listing: Listing;
}

export function RoomContactCard({ listing }: RoomContactCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const phone = listing.landlord?.phone ?? null;

  async function contactLandlord(): Promise<void> {
    if (!user) {
      void navigate(ROUTES.LOGIN);
      return;
    }
    try {
      const conv = await startConversation(listing.id);
      void navigate(route(ROUTES.CONVERSATION, { id: conv.id }));
    } catch {
      toast("Không mở được hội thoại. Bạn thử lại nhé.");
    }
  }

  const initial = (listing.landlord?.name ?? "?").trim().charAt(0).toUpperCase();
  const available = listing.status === "available";

  return (
    <aside
      data-testid="contact-card"
      className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 shadow-card"
    >
      <div>
        <p className="text-3xl font-extrabold tabular-nums text-plate">
          {formatPriceShort(listing.price)}
          <small className="ml-1 text-sm font-normal text-muted">/tháng</small>
        </p>
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1.5 text-sm font-semibold",
            available ? "text-moss" : "text-muted"
          )}
        >
          <span className={cn("size-2 rounded-full", available ? "bg-moss" : "bg-line-strong")} aria-hidden />
          {available ? "Còn trống" : listing.status === "rented" ? "Đã thuê" : "Đang ẩn"}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-tint p-3">
        <span
          aria-hidden
          className="grid size-11 flex-none place-items-center rounded-full bg-plate-tint text-base font-extrabold text-plate"
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{listing.landlord?.name ?? "Chưa rõ"}</p>
          <p className="text-xs text-muted">Chủ nhà</p>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {user?.role !== "student" && phone == null ? (
          <p className="text-xs text-muted">Đăng nhập bằng tài khoản sinh viên để xem số điện thoại</p>
        ) : null}
        <div className="flex gap-2">
          <Button variant="primary" className="motion-press flex-1 text-base" onClick={() => void contactLandlord()}>
            <MessageCircle className="size-4" aria-hidden />
            Nhắn tin cho chủ nhà
          </Button>
          {phone ? (
            <Button variant="outline" size="icon" asChild>
              <a href={`tel:${phone}`} aria-label={`Gọi ${phone}`} title={phone}>
                <Phone className="size-4" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
