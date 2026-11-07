import { Skeleton } from "@/ui/badge";

/** Placeholder with the same grid as the loaded room page, so nothing jumps. */
export function RoomSkeleton() {
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
