import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as LeafletMap } from "leaflet";

const START_VIEW: [number, number] = [16.0471, 108.2068];
const START_ZOOM = 5;

/**
 * A click-to-pick map. Leaflet is loaded lazily. The callback is read through a
 * ref so the map is created once: restarting it whenever the parent re-rendered
 * (every keystroke in the form) used to throw away the marker you had just placed.
 */
function point(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined,
): [number, number] | null {
  if (lat == null || lng == null || lat === "" || lng === "") return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? [latitude, longitude]
    : null;
}

function updateView(map: LeafletMap, marker: CircleMarker, location: CoordinatePickerProps): void {
  const selected = point(location.lat, location.lng);
  const center = point(location.centerLat, location.centerLng);
  if (selected) marker.setLatLng(selected).addTo(map);
  else marker.remove();
  map.setView(
    selected ?? center ?? START_VIEW,
    selected ? Math.max(map.getZoom(), 15) : center ? 13 : START_ZOOM,
  );
}

function useClickMap(location: CoordinatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPickRef = useRef(location.onPick);
  const locationRef = useRef(location);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    onPickRef.current = location.onPick;
    locationRef.current = location;
  });

  useEffect(() => {
    if (mapRef.current && markerRef.current)
      updateView(mapRef.current, markerRef.current, locationRef.current);
  }, [location.lat, location.lng, location.centerLat, location.centerLng]);

  useEffect(() => {
    const el = containerRef.current;
    let map: LeafletMap | null = null;
    let active = true;
    let observer: ResizeObserver | undefined;

    void import("leaflet")
      .then((L) => {
        if (!active || !el) return;
        const created = L.map(el, { scrollWheelZoom: true }).setView(START_VIEW, START_ZOOM);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(created);
        const marker = L.circleMarker(START_VIEW, {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 1,
        });
        created.on("click", (e) => {
          marker.setLatLng(e.latlng).addTo(created);
          onPickRef.current(e.latlng.lat, e.latlng.lng);
        });
        map = created;
        mapRef.current = created;
        markerRef.current = marker;
        updateView(created, marker, locationRef.current);
        observer = new ResizeObserver(() => {
          created.invalidateSize();
        });
        observer.observe(el);
      })
      .catch(() => {
        if (active) setError("Không tải được bản đồ. Bạn có thể nhập tọa độ ở bên dưới.");
      });

    return () => {
      active = false;
      observer?.disconnect();
      map?.remove();
      map = null;
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return { containerRef, error };
}

export interface CoordinatePickerProps {
  lat: number | string;
  lng: number | string;
  onPick: (lat: number, lng: number) => void;
  centerLat?: number | null | undefined;
  centerLng?: number | null | undefined;
}

/** Map plus a label with the current coordinates. */
export function CoordinatePicker(props: CoordinatePickerProps) {
  const { containerRef, error } = useClickMap(props);
  const { lat, lng } = props;
  return (
    <div className="relative isolate h-full w-full" data-testid="coordinate-picker">
      <div ref={containerRef} className="h-full w-full" />
      <p
        className={
          "pointer-events-none absolute left-14 right-2 top-2 z-10 w-fit rounded-lg bg-card/90 px-2 py-1 text-xs " +
          "tabular-nums text-ink border border-line"
        }
      >
        {lat === "" ? "—" : lat}, {lng === "" ? "—" : lng}
      </p>
      {error ? (
        <p
          role="alert"
          className="absolute bottom-2 left-2 right-2 z-[1000] rounded-lg bg-card p-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
