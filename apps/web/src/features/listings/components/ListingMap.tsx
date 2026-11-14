import { formatVnd } from "@/shared/lib/format";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import type { Listing, School } from "@/shared/types/api";
import "@/features/listings/components/leaflet-pins.css";

/*
  Price pins: white pills with 1px ink border, small tail, tabular
  numbers. Hover/selected = plate. Clusters: ink circles with paper
  numbers. Warm tiles via .leaflet-tile-pane filter (styles.css).
*/

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];

export interface ListingMapProps {
  listings: Listing[];
  school?: School | null;
  radiusKm?: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onHover?: (id: number | null) => void;
  ariaLabel?: string;
  hasLocationFilter?: boolean;
  /** Wheel zoom hijacks page scroll; embedded maps turn it off. */
  scrollWheelZoom?: boolean;
}

/* Cluster icon: ink circle with paper number. */
function makeClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<span class="trosv-cluster" aria-hidden="true">${count}</span>`,
    className: "trosv-cluster-wrap",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function makePinIcon(listing: Listing, selected: boolean): L.DivIcon {
  return L.divIcon({
    html: `<span
      class="trosv-pin${selected ? " trosv-pin--selected" : ""}"
      role="button"
      tabindex="0"
      aria-label="${formatVnd(listing.price)} một tháng, ${listing.title.replace(/"/g, "&quot;")}"
    >${formatVnd(listing.price)}</span>`,
    className: "trosv-pin-wrap",
    iconSize: [40, 40],
    iconAnchor: [20, 22],
  });
}

// Ensure Leaflet is available globally for plugins
if (typeof window !== "undefined" && !(window as unknown as { L?: typeof L }).L) {
  (window as unknown as { L: typeof L }).L = L;
}

type Coordinates = { latitude: number; longitude: number };
type SchoolPoint = School & Coordinates;
type MapView = {
  points: (Listing & Coordinates)[];
  schoolPoint: SchoolPoint | null;
  hasLocationFilter: boolean;
};

function hasCoordinates<T extends { latitude?: number | null; longitude?: number | null }>(
  point: T | null,
): point is T & Coordinates {
  return (
    point !== null &&
    typeof point.latitude === "number" &&
    typeof point.longitude === "number" &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

function fitMapToView(map: L.Map, view: MapView, circle: L.Circle | null): void {
  const { points: pts, schoolPoint: target, hasLocationFilter: locationFilter } = view;
  if (target && circle) {
    map.fitBounds(circle.getBounds(), { padding: [40, 40], maxZoom: 15 });
    return;
  }
  if (!target && (!locationFilter || pts.length === 0)) {
    map.setView(DEFAULT_CENTER, 11);
    return;
  }
  const validLatLngs: [number, number][] = pts.map((p) => [p.latitude, p.longitude]);
  if (target) validLatLngs.push([target.latitude, target.longitude]);
  if (validLatLngs.length === 1 && validLatLngs[0]) {
    map.setView(validLatLngs[0], 14);
  } else if (validLatLngs.length > 1) {
    const bounds = L.latLngBounds(validLatLngs);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
}

function addSchoolToMap(map: L.Map, schoolPoint: SchoolPoint, radiusMeters: number) {
  const center: [number, number] = [schoolPoint.latitude, schoolPoint.longitude];
  const label = document.createElement("span");
  label.textContent = schoolPoint.name;
  const popup = document.createElement("div");
  popup.className = "trosv-school-popup";
  const name = document.createElement("strong");
  name.textContent = schoolPoint.name;
  popup.append(name);
  for (const text of [schoolPoint.campus_name, schoolPoint.address]) {
    if (!text) continue;
    const line = document.createElement("p");
    line.textContent = text;
    popup.append(line);
  }
  const marker = L.marker(center, {
    icon: L.divIcon({
      className: "trosv-school-marker",
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v6c3 3 9 3 12 0v-6M22 9v7"/></svg>',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -22],
    }),
    title: schoolPoint.name,
    alt: `Trường đã chọn: ${schoolPoint.name}`,
    keyboard: true,
    zIndexOffset: 1000,
  })
    .bindTooltip(label, {
      permanent: true,
      direction: "top",
      offset: [0, -22],
      className: "trosv-school-label",
    })
    .bindPopup(popup, { maxWidth: 260 })
    .addTo(map);
  const circle =
    radiusMeters > 0
      ? L.circle(center, {
          radius: radiusMeters,
          color: "#1d4ed8",
          weight: 2,
          fillOpacity: 0.08,
          interactive: false,
          className: "trosv-school-radius",
        }).addTo(map)
      : null;
  return { marker, circle };
}

function SchoolMapLegend({ radiusKm }: { radiusKm: number }) {
  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-[500] max-w-[75%] rounded-lg bg-white/95 px-3 py-2 text-xs text-ink shadow-sm"
      data-testid="school-map-legend"
    >
      <span className="font-semibold text-blue-700">Trường đã chọn</span>
      {radiusKm > 0 ? (
        <span className="mt-1 block">
          Bán kính {new Intl.NumberFormat("vi-VN").format(radiusKm)} km · đường chim bay
        </span>
      ) : null}
    </div>
  );
}

export function ListingMap({
  listings,
  school = null,
  radiusKm = 0,
  selectedId,
  onSelect,
  onHover,
  ariaLabel = "Bản đồ phòng trọ",
  hasLocationFilter = false,
  scrollWheelZoom = true,
}: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clusterGroup = useRef<L.MarkerClusterGroup | L.FeatureGroup | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const schoolCircle = useRef<L.Circle | null>(null);
  const prevListingsKey = useRef<string>("");
  const [ready, setReady] = useState(false);

  const points = useMemo(() => listings.filter(hasCoordinates), [listings]);

  const listingsKey = points
    .map((point) => point.id)
    .sort()
    .join(",");

  const schoolPoint = hasCoordinates(school) ? school : null;
  const radiusMeters = Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm * 1000 : 0;
  const latestViewRef = useRef({ points, schoolPoint, hasLocationFilter });

  useEffect(() => {
    latestViewRef.current = { points, schoolPoint, hasLocationFilter };
  }, [points, schoolPoint, hasLocationFilter]);

  const fitBoundsToPoints = useCallback(() => {
    const map = leafletMap.current;
    if (!map) return;

    fitMapToView(map, latestViewRef.current, schoolCircle.current);
  }, []);

  // Initialize map instance once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || leafletMap.current) return;

    const map = L.map(el, { scrollWheelZoom });
    map.setView(DEFAULT_CENTER, 11);
    leafletMap.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    setReady(true);

    let hadNonZeroSize = false;
    const ro = new ResizeObserver((entries) => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
        for (const entry of entries) {
          if (entry.contentRect.width > 50 && entry.contentRect.height > 50) {
            if (!hadNonZeroSize) {
              hadNonZeroSize = true;
              fitBoundsToPoints();
            }
          }
        }
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      leafletMap.current = null;
      clusterGroup.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the selected school separate from room clusters so it stays visible.
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !schoolPoint) return;
    const { marker, circle } = addSchoolToMap(map, schoolPoint, radiusMeters);
    schoolCircle.current = circle;
    return () => {
      marker.remove();
      circle?.remove();
      schoolCircle.current = null;
    };
  }, [schoolPoint, radiusMeters, ready]);

  // Update markers and fit bounds
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Resolve cluster factory from L or window.L
    const clusterFactory =
      (L as unknown as { markerClusterGroup?: (opts: unknown) => L.MarkerClusterGroup })
        .markerClusterGroup ||
      (typeof window !== "undefined" &&
        (
          window as unknown as {
            L?: { markerClusterGroup?: (opts: unknown) => L.MarkerClusterGroup };
          }
        ).L?.markerClusterGroup);

    if (!clusterGroup.current) {
      if (typeof clusterFactory === "function") {
        clusterGroup.current = clusterFactory({
          iconCreateFunction: makeClusterIcon,
          showCoverageOnHover: false,
          maxClusterRadius: 55,
        });
      } else {
        clusterGroup.current = L.featureGroup();
      }
      map.addLayer(clusterGroup.current);
    } else {
      clusterGroup.current.clearLayers();
    }

    for (const item of points) {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: makePinIcon(item, item.id === selectedId),
        keyboard: true,
        alt: `${formatVnd(item.price)} - ${item.title}`,
      });
      marker.on("click", () => {
        onSelect(item.id);
      });
      marker.on("mouseover", () => onHover?.(item.id));
      marker.on("mouseout", () => onHover?.(null));
      clusterGroup.current.addLayer(marker);
    }

    // Fit bounds only when the listings set or location filter actually changes
    const filterKey = `${listingsKey}:${hasLocationFilter}:${schoolPoint?.id}:${schoolPoint?.latitude}:${schoolPoint?.longitude}:${radiusMeters}`;
    if (prevListingsKey.current !== filterKey) {
      prevListingsKey.current = filterKey;
      fitBoundsToPoints();
    }
  }, [
    points,
    listingsKey,
    selectedId,
    onSelect,
    onHover,
    hasLocationFilter,
    fitBoundsToPoints,
    schoolPoint,
    radiusMeters,
    ready,
  ]);

  return (
    <div className="relative isolate h-full w-full">
      <div
        ref={containerRef}
        role="application"
        aria-label={ariaLabel}
        className="h-full w-full"
        data-testid="map"
        data-ready={ready ? "true" : "false"}
      />
      {schoolPoint ? <SchoolMapLegend radiusKm={radiusMeters / 1000} /> : null}
    </div>
  );
}
