import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useRoomDetail } from "@/hooks/useRoomDetail";
import { aiPriceAdvice } from "@/api/aiApi";
import type { AiPriceAdvice } from "@/types/api";
import { addFavorite, removeFavorite } from "@/api/socialApi";
import { Button } from "@/ui/button";
import { Avatar } from "@/ui/avatar";
import { Skeleton, Tag, Rating } from "@/ui/badge";
import { ListingMap } from "@/components/ListingMap";
import { ErrorState } from "@/ui/empty-state";
import { toast } from "@/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatVnd, TYPE_LABELS } from "@/lib/format";
import { RoomLightbox } from "./room/RoomLightbox";
import { RoomContactCard } from "./room/RoomContactCard";
import { RoomGallery } from "./room/RoomGallery";
import { SimilarRooms } from "./room/SimilarRooms";
import {
  Sparkles,
  MapPin,
  ArrowLeft,
  Heart,
  Share2,
  Ruler,
  GraduationCap,
  Home,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomDetail() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  const detail = useRoomDetail(id);
  const { user } = useAuth();
  const [now] = useState(() => Date.now());

  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const [advice, setAdvice] = useState<AiPriceAdvice | null>(null);
  const [adviceBusy, setAdviceBusy] = useState(false);
  const [adviceError, setAdviceError] = useState("");

  useDocumentTitle(detail.listing ? `${detail.listing.title} · TROSV` : "Chi tiết phòng · TROSV");

  const images = detail.listing?.images ?? [];
  const cover = detail.listing?.cover_image ?? images[0]?.url ?? null;
  const isFav = detail.listing?.is_favorited === true;

  async function askAi(): Promise<void> {
    setAdviceBusy(true);
    setAdviceError("");
    try {
      setAdvice(await aiPriceAdvice(id));
    } catch {
      setAdviceError("Trợ lý AI đang bận. Bạn thử lại sau ít phút nhé.");
    } finally {
      setAdviceBusy(false);
    }
  }

  async function toggleFav(): Promise<void> {
    const listing = detail.listing;
    if (!listing || !user || user.role !== "student") return;
    const next = !isFav;
    detail.setListing((l) => (l ? { ...l, is_favorited: next } : l));
    try {
      if (next) {
        await addFavorite(listing.id);
        toast("Đã lưu phòng.");
      } else {
        await removeFavorite(listing.id);
        toast("Đã bỏ lưu phòng.");
      }
    } catch {
      detail.setListing((l) => (l ? { ...l, is_favorited: !next } : l));
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

  if (detail.loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="aspect-3/2 w-full rounded-xl lg:aspect-auto lg:h-[480px]" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (detail.error) {
    return (
      <ErrorState
        message={detail.error}
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.ROOMS}>Về danh sách phòng</Link>
          </Button>
        }
        className="min-h-[60vh]"
      />
    );
  }

  const listing = detail.listing;
  if (!listing) return null;

  const daysAgo = listing.created_at
    ? Math.max(0, Math.floor((now - new Date(listing.created_at).getTime()) / 86_400_000))
    : null;
  const km = listing.distance_km;
  const tiles: { icon: typeof Ruler; value: string; label: string; tone: string }[] = [];
  if (listing.area_m2 != null) {
    tiles.push({
      icon: Ruler,
      value: `${listing.area_m2} m²`,
      label: "Diện tích",
      tone: "bg-flyer/25",
    });
  }
  if (km != null) {
    tiles.push({
      icon: GraduationCap,
      value: `${km.toFixed(1)} km`,
      label: `Tới trường · ~${Math.max(1, Math.round(km * 3))} phút xe`,
      tone: "bg-plate-tint",
    });
  }
  tiles.push({
    icon: Home,
    value: TYPE_LABELS[listing.type ?? ""] ?? "Phòng trọ",
    label: "Loại phòng",
    tone: "bg-moss-tint",
  });
  if (daysAgo != null) {
    tiles.push({
      icon: Clock,
      value: daysAgo === 0 ? "Hôm nay" : `${daysAgo} ngày`,
      label: daysAgo === 0 ? "Đăng tin" : "Trước đây đăng",
      tone: "bg-danger-tint",
    });
  }

  const tile = "rounded-xl border border-line bg-card p-5 shadow-card";
  const rated =
    listing.ratings?.listing_avg ?? listing.average_rating ?? listing.avg_rating ?? null;
  const ratingRows: [string, number | null | undefined][] = [
    ["Phòng", listing.ratings?.listing_avg],
    ["Chủ nhà", listing.ratings?.landlord_avg],
    ["Khu vực", listing.ratings?.area_avg],
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 pb-28 lg:p-6 lg:pb-10">
      <Link
        to={ROUTES.ROOMS}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-plate"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại kết quả tìm kiếm
      </Link>

      {/* Title row */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <Tag variant="paper">{TYPE_LABELS[listing.type ?? ""] ?? "Phòng trọ"}</Tag>
            {listing.status === "available" ? (
              <Tag className="bg-moss-tint text-moss">Còn trống</Tag>
            ) : null}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">
            {listing.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-4 text-plate" aria-hidden />
            <span>
              {listing.address}
              {listing.ward && !listing.address.includes(listing.ward.name)
                ? `, ${listing.ward.name}`
                : ""}
            </span>
          </p>
          {rated != null ? (
            <p className="mt-1.5 text-sm text-ink-2">
              <Rating value={rated} />
              <span className="ml-1 text-muted">
                · {listing.reviews_count ?? detail.reviews.length} đánh giá
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void toggleFav()}
            aria-pressed={isFav}
            className={cn(
              isFav && "border-danger/30 text-danger hover:bg-danger-tint hover:text-danger",
            )}
          >
            <Heart className={cn("size-4", isFav && "fill-danger")} aria-hidden />
            {isFav ? "Đã lưu" : "Lưu"}
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Share2 className="size-4" aria-hidden />
            Chia sẻ
          </Button>
        </div>
      </div>

      {/* Bento: hero row */}
      <div className="motion-stagger mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <RoomGallery
          images={images.length > 0 ? images : cover ? [{ id: 0, url: cover }] : []}
          onOpen={setLightboxAt}
        />
        <div className="flex flex-col gap-4">
          <RoomContactCard listing={listing} />
          <section className="rounded-xl border border-moss/25 bg-moss-tint p-5 shadow-card">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-moss">
              <Sparkles className="size-3.5" aria-hidden />
              Gợi ý giá
            </div>
            {user?.role !== "student" ? (
              <p className="text-sm text-ink-2">
                Đăng nhập bằng tài khoản sinh viên để xem mức giá hợp lý từ trợ lý AI.
              </p>
            ) : advice ? (
              <div data-testid="ai-price">
                <p className="font-bold text-ink">
                  Khoảng giá hợp lý: {formatVnd(advice.fair_min ?? 0)} –{" "}
                  {formatVnd(advice.fair_max ?? 0)}/tháng
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {advice.tips?.[0] ??
                    advice.message ??
                    "Giá phòng phù hợp với mặt bằng chung khu vực."}
                </p>
                <p className="mt-2 text-xs text-muted">
                  * Tham khảo, dựa trên phòng trọ cùng phường/quận.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2">
                {adviceError ? <p className="text-sm text-danger">{adviceError}</p> : null}
                <Button
                  variant="outline"
                  size="sm"
                  loading={adviceBusy}
                  onClick={() => void askAi()}
                >
                  <Sparkles className="size-4 text-plate" aria-hidden />
                  Hỏi giá phòng này
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Quick-fact tiles */}
      <div
        className="motion-stagger mt-4 grid grid-cols-2 gap-4 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ "--n": tiles.length } as React.CSSProperties}
      >
        {tiles.map((t) => (
          <div
            key={t.label}
            data-testid="fact-tile"
            className={cn("rounded-xl border border-line p-4 shadow-card", t.tone)}
          >
            <t.icon className="mb-3 size-5 text-ink-2" aria-hidden />
            <p className="text-xl font-extrabold tabular-nums text-ink">{t.value}</p>
            <p className="mt-0.5 text-xs text-muted">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Description + amenities */}
      {listing.description || (listing.amenities && listing.amenities.length > 0) ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[7fr_5fr]">
          {listing.description ? (
            <section className={tile}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Mô tả</h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-ink-2">
                {listing.description}
              </p>
            </section>
          ) : null}
          {listing.amenities && listing.amenities.length > 0 ? (
            <section className={tile}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                Tiện ích
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium text-ink"
                  >
                    {a.name ?? `Tiện ích ${a.id}`}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {/* Map + reviews */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[5fr_7fr]">
        {typeof listing.latitude === "number" && typeof listing.longitude === "number" ? (
          <section className={tile}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Vị trí</h2>
            <div className="h-64 overflow-hidden rounded-lg border border-line">
              <ListingMap
                listings={[listing]}
                selectedId={listing.id}
                onSelect={() => undefined}
                hasLocationFilter
                scrollWheelZoom={false}
                ariaLabel={`Vị trí ${listing.title}`}
              />
            </div>
          </section>
        ) : null}
        <section className={cn(tile, listing.latitude == null && "lg:col-span-2")}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Đánh giá</h2>
            {listing.can_review && user?.role === "student" ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`${ROUTES.ROOM_DETAIL}?review=1`}>Viết đánh giá</Link>
              </Button>
            ) : null}
          </div>
          {ratingRows.some(([, v]) => v != null) ? (
            <dl className="mb-4 grid gap-1.5 text-sm">
              {ratingRows.map(([label, v]) => (
                <div key={label} className="flex items-center gap-3">
                  <dt className="w-16 text-muted">{label}</dt>
                  <dd className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                    <span
                      className="block h-full rounded-full bg-flyer"
                      style={{ width: `${((v ?? 0) / 5) * 100}%` }}
                    />
                  </dd>
                  <dd className="w-8 text-right font-semibold tabular-nums text-ink">
                    {v != null ? v.toFixed(1) : "–"}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {detail.reviews.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
              Chưa có đánh giá nào cho phòng này. Bạn từng ở đây? Hãy là người đầu tiên chia sẻ trải
              nghiệm.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {detail.reviews.map((r) => (
                <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        name={r.student?.name ?? r.user_name ?? "Sinh viên"}
                        avatar={r.student?.avatar}
                        size={32}
                      />
                      <p className="truncate font-semibold text-ink">
                        {r.student?.name ?? r.user_name ?? "Sinh viên"}
                      </p>
                    </div>
                    <Rating value={r.listing_rating ?? r.rating} />
                  </div>
                  {r.comment ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{r.comment}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <SimilarRooms listing={listing} />
      <div data-testid="room-end" aria-hidden />

      {/* Mobile sticky bottom bar */}
      <div
        data-testid="room-mobile-bar"
        className="fixed bottom-14 left-0 right-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 shadow-pop lg:hidden"
      >
        <div>
          <span className="text-xs text-muted">Giá thuê</span>
          <p className="text-xl font-bold tabular-nums text-plate">
            {formatVnd(listing.price)}
            <small className="ml-1 text-xs font-normal text-muted">/th</small>
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            const el = document.querySelector<HTMLButtonElement>(
              '[data-testid="contact-card"] button',
            );
            el?.click();
          }}
        >
          Nhắn tin chủ nhà
        </Button>
      </div>

      {lightboxAt != null && images.length > 0 ? (
        <RoomLightbox
          images={images}
          index={lightboxAt}
          onClose={() => {
            setLightboxAt(null);
          }}
          onNavigate={setLightboxAt}
        />
      ) : null}
    </div>
  );
}
