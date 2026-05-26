import { cn } from '../../lib/cn.js';

/* Base shimmer block. */
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

/* Matches the footprint of a ListingCard so swaps are layout-stable. */
export function CardSkeleton() {
  return (
    <div className="card p-0">
      <Skeleton className="aspect-[4/3] w-full rounded-b-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="section py-8">
      <Skeleton className="h-72 w-full rounded-3xl sm:h-96" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
