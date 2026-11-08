import { useEffect, useState } from "react";
import { getListing } from "@/api/listingApi";
import type { Listing } from "@/types/api";

// Shared by every bubble, so a room mentioned ten times is fetched once.
const roomCache = new Map<number, Listing>();

/** Loads a room for the preview card; `room` stays null if it cannot be loaded. */
export function useRoomPreview(roomId: number) {
  const cached = roomCache.get(roomId);
  const [room, setRoom] = useState<Listing | null>(() => cached ?? null);
  const [loading, setLoading] = useState<boolean>(() => !cached);

  useEffect(() => {
    if (roomCache.has(roomId)) return;

    let active = true;
    getListing(roomId)
      .then((data) => {
        if (!active) return;
        roomCache.set(roomId, data);
        setRoom(data);
      })
      .catch(() => {
        if (!active) return;
        setRoom(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  return { room, loading };
}
