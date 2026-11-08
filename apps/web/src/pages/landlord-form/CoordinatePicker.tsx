import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

const START_VIEW: [number, number] = [16.0471, 108.2068];
const START_ZOOM = 5;

/**
 * A click-to-pick map. Leaflet is loaded lazily. The callback is read through a
 * ref so the map is created once: restarting it whenever the parent re-rendered
 * (every keystroke in the form) used to throw away the marker you had just placed.
 */
function useClickMap(onPick: (lat: number, lng: number) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    const el = containerRef.current;
    let map: LeafletMap | null = null;
    let active = true;

    void import("leaflet").then((L) => {
      if (!active || !el) return;
      const created = L.map(el).setView(START_VIEW, START_ZOOM);
      const marker = L.marker(START_VIEW);
      created.on("click", (e) => {
        marker.setLatLng(e.latlng).addTo(created);
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });
      map = created;
    });

    return () => {
      active = false;
      map?.remove();
      map = null;
    };
  }, []);

  return containerRef;
}

export interface CoordinatePickerProps {
  lat: number | string;
  lng: number | string;
  onPick: (lat: number, lng: number) => void;
}

/** Map plus a label with the current coordinates. */
export function CoordinatePicker({ lat, lng, onPick }: CoordinatePickerProps) {
  const containerRef = useClickMap(onPick);
  return (
    <div className="relative h-full w-full" data-testid="coordinate-picker">
      <div ref={containerRef} className="h-full w-full" />
      <p
        className={
          "absolute left-2 top-2 z-[1000] rounded-lg bg-card/90 px-2 py-1 text-xs " +
          "tabular-nums text-ink border border-line"
        }
      >
        {lat || "—"}, {lng || "—"}
      </p>
    </div>
  );
}
