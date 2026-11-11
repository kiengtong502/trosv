import { Skeleton } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

/*
  Loading placeholder shaped like ListingCard (photo, two title lines,
  address, area pill + rating) so the grid does not jump when data arrives.
*/
export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-testid="listing-skeleton"
      aria-hidden
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-line bg-card",
        className,
      )}
    >
      <Skeleton className="aspect-3/2 w-full rounded-none" />
      <div className="flex flex-col gap-2.5 p-3.5">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-1 flex items-center justify-between">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
