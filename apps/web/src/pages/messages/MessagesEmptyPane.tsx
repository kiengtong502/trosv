import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ART_ASSETS } from "@/constants/assets";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

/* Right-hand pane on desktop while no conversation is open. */
export function MessagesEmptyPane() {
  const { user } = useAuth();
  const isLandlord = user?.role === "landlord";

  return (
    <div
      data-testid="messages-empty-pane"
      className="hidden h-full flex-col items-center justify-center overflow-y-auto p-8 text-center md:flex"
    >
      <img
        src={ART_ASSETS.INBOX_GATE}
        alt=""
        width={1400}
        height={780}
        className="motion-float w-full max-w-sm rounded-xl"
        loading="lazy"
      />
      <h2 className="mt-6 font-display text-xl font-extrabold tracking-tight text-ink">
        Chọn một cuộc trò chuyện
      </h2>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
        {isLandlord
          ? "Trả lời sinh viên quan tâm đến tin đăng của bạn. Mọi tin nhắn sẽ nằm ở đây."
          : "Hỏi chủ trọ về giá, lịch xem phòng hoặc nhắn bạn cùng phòng. Mọi tin nhắn của bạn sẽ nằm ở đây."}
      </p>
      <Link
        to={isLandlord ? ROUTES.LANDLORD : ROUTES.ROOMS}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-plate px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-plate-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        {isLandlord ? "Quản lý tin đăng" : "Tìm phòng ngay"}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
