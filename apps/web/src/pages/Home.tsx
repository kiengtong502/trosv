import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ART_ASSETS } from "@/constants/assets";
import { getListings, getCities, getSchools } from "@/api/listingApi";
import type { Listing, City, School } from "@/types/api";
import { Button } from "@/ui/button";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { PlateBand } from "@/ui/plate-band";
import { ErrorState } from "@/ui/empty-state";
import { SearchEmptyIllustration } from "@/ui/icons";
import { ListingCard } from "@/components/ListingCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useReveal } from "@/hooks/useReveal";
import { Search as SearchIcon, GraduationCap, MapPin } from "lucide-react";

function HeroSearch({ cities, schools }: { cities: City[]; schools: School[] }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    const params = trimmed ? { q: trimmed } : {};
    void navigate({ pathname: ROUTES.ROOMS, search: new URLSearchParams(params).toString() });
  }

  const queryLower = q.trim().toLowerCase();
  const matchedSchools = queryLower.length > 1
    ? schools.filter((s) => s.name.toLowerCase().includes(queryLower)).slice(0, 4)
    : [];
  const matchedCities = queryLower.length > 1
    ? cities.filter((c) => c.name.toLowerCase().includes(queryLower)).slice(0, 3)
    : [];

  const hasSuggestions = matchedSchools.length > 0 || matchedCities.length > 0;

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="relative">
        <div className="flex h-16 items-center gap-2 rounded-xl border border-line-strong bg-card p-2 pl-4 shadow-pop">
          <SearchIcon className="size-5 flex-none text-muted" aria-hidden />
          <input
            type="search"
            placeholder="Nhập trường, phường hoặc tên đường..."
            aria-label="Tìm phòng"
            value={q}
            onChange={(e) => { setQ(e.target.value); }}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Tìm phòng"
            className="flex size-12 flex-none items-center justify-center rounded-lg bg-plate text-white transition-colors hover:bg-plate-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
          >
            <SearchIcon className="size-5" aria-hidden />
          </button>
        </div>

        {hasSuggestions ? (
          <div className="absolute left-0 right-0 top-[72px] z-20 rounded-xl border border-line bg-card p-2 shadow-pop">
            {matchedSchools.length > 0 ? (
              <div className="mb-2">
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Trường Đại học / Cao đẳng
                </span>
                {matchedSchools.map((s) => (
                  <Link
                    key={s.id}
                    to={`${ROUTES.ROOMS}?school_id=${s.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-tint"
                    onClick={() => { setQ(""); }}
                  >
                    <GraduationCap className="size-4 text-plate" aria-hidden />
                    <span>{s.name}</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {matchedCities.length > 0 ? (
              <div>
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Tỉnh / Thành phố
                </span>
                {matchedCities.map((c) => (
                  <Link
                    key={c.id}
                    to={`${ROUTES.ROOMS}?city_id=${c.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-tint"
                    onClick={() => { setQ(""); }}
                  >
                    <MapPin className="size-4 text-muted" aria-hidden />
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}

export default function Home() {
  useDocumentTitle("Trang chủ · TROSV");
  const revealNewest = useReveal();
  const revealLists = useReveal();
  const revealCta = useReveal();
  const [newest, setNewest] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    getListings({ per_page: 8, sort: "newest" })
      .then((res) => { setNewest(res.data); })
      .catch((err: unknown) => { setError(String(err)); })
      .finally(() => { setLoading(false); });

    getCities().then(setCities).catch(() => {});
    getSchools().then(setSchools).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero: navy plate band with the hand-drawn bento art anchored right */}
      <PlateBand
        size="hero"
        title="Phòng trọ. Căn hộ."
        highlight="Gần trường."
        backdrop={
          <img
            src={ART_ASSETS.HERO_DESKTOP}
            alt=""
            width={2100}
            height={623}
            loading="eager"
            className="hidden min-[1300px]:block absolute inset-0 h-full w-full object-cover object-right pointer-events-none select-none"
            onError={(e) => {
              (e.currentTarget).style.display = "none";
            }}
          />
        }
      >
        <HeroSearch cities={cities} schools={schools} />

        {/* Mobile-dedicated hero illustration: perfectly proportioned and complete on any phone */}
        <div className="mt-1 w-full max-w-xl min-[1300px]:hidden">
          <img
            src={ART_ASSETS.HERO_MOBILE}
            alt="Minh họa phòng trọ sinh viên"
            width={680}
            height={280}
            loading="eager"
            className="w-full h-auto rounded-2xl border border-line/60 bg-card shadow-2xs"
          />
        </div>
      </PlateBand>

      <div className="mx-auto w-full max-w-6xl px-5">
        {/* Quick filter pills */}
        <div className="flex flex-wrap gap-2 py-8">
          {[
            { label: "Phòng trọ", params: { type: "room" } },
            { label: "Căn hộ", params: { type: "apartment" } },
            { label: "Nhà nguyên căn", params: { type: "house" } },
            { label: "Dưới 2 triệu", params: { price_max: "2000000" } },
          ].map(({ label, params }) => (
            <Link
              key={label}
              to={`${ROUTES.ROOMS}?${new URLSearchParams(params).toString()}`}
              className="inline-flex h-9 items-center rounded-full border border-line-strong bg-card px-4 text-sm font-medium text-ink transition-colors hover:border-plate hover:text-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mới đăng */}
        <section ref={revealNewest} className="pb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Mới đăng</h2>
            <Link
              to={ROUTES.ROOMS}
              className="text-sm font-medium text-plate hover:text-plate-hover hover:underline"
            >
              Xem tất cả phòng &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              <ListingCardSkeleton className="w-72 flex-none" />
              <ListingCardSkeleton className="w-72 flex-none" />
              <ListingCardSkeleton className="w-72 flex-none" />
              <ListingCardSkeleton className="w-72 flex-none" />
            </div>
          ) : error ? (
            <ErrorState message="Không tải được phòng mới đăng. Bạn thử lại sau ít phút nhé." />
          ) : newest.length === 0 ? (
            <SearchEmptyIllustration className="max-w-xs self-center" />
          ) : (
            <div className="motion-stagger -mx-5 flex snap-x scroll-pl-5 gap-4 overflow-x-auto px-5 pb-4">
              {newest.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  className="w-72 flex-none snap-start"
                />
              ))}
            </div>
          )}
        </section>

        {/* School + city link lists */}
        {schools.length > 0 || cities.length > 0 ? (
          <section ref={revealLists} className="grid gap-8 pb-16 md:grid-cols-2">
            {schools.length > 0 ? (
              <div className="rounded-xl border border-line bg-card p-5">
                <h2 className="mb-3 text-lg font-bold text-ink flex items-center gap-2">
                  <GraduationCap className="size-5 text-plate" aria-hidden />
                  Tìm theo trường
                </h2>
                <ul className="flex flex-col divide-y divide-line">
                  {schools.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`${ROUTES.ROOMS}?school_id=${s.id}`}
                        className={
                          "flex items-center justify-between py-2.5 text-sm font-medium text-ink " +
                          "transition-colors hover:text-plate focus-visible:outline-none " +
                          "focus-visible:ring-2 focus-visible:ring-plate"
                        }
                      >
                        <span>{s.name}</span>
                        <span className="text-xs text-muted">&rarr;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {cities.length > 0 ? (
              <div className="rounded-xl border border-line bg-card p-5">
                <h2 className="mb-3 text-lg font-bold text-ink flex items-center gap-2">
                  <MapPin className="size-5 text-plate" aria-hidden />
                  Tìm theo thành phố
                </h2>
                <ul className="flex flex-col divide-y divide-line">
                  {cities.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`${ROUTES.ROOMS}?city_id=${c.id}`}
                        className={
                          "flex items-center justify-between py-2.5 text-sm font-medium text-ink " +
                          "transition-colors hover:text-plate focus-visible:outline-none " +
                          "focus-visible:ring-2 focus-visible:ring-plate"
                        }
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-muted">&rarr;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Landlord banner */}
        <section ref={revealCta} className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-card p-8">
          <div>
            <h2 className="text-2xl font-bold text-ink">Bạn có phòng cho thuê?</h2>
            <p className="mt-1 text-muted">
              Đăng tin miễn phí và nhận tin nhắn trực tiếp từ sinh viên.
            </p>
          </div>
          <Button asChild variant="primary">
            <Link to={ROUTES.REGISTER}>Đăng tin ngay</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
