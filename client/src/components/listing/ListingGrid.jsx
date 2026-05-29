import ListingCard from './ListingCard.jsx';
import { CardSkeleton } from '../ui/Skeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';

/* Responsive card grid with built-in loading and empty states. */
export default function ListingGrid({
  vertical,
  items = [],
  loading = false,
  skeletonCount = 8,
  empty,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      empty || (
        <EmptyState
          title="No results found"
          description="Try adjusting your filters or search for something else."
        />
      )
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, i) => (
        <ListingCard key={item._id} vertical={vertical} item={item} index={i} />
      ))}
    </div>
  );
}
