import ListingCard from './ListingCard.jsx';
import { CardSkeleton } from '../ui/Skeleton.jsx';

/* Card rail — 2-column grid on mobile, horizontally scrollable rail on tablet+. */
export default function ListingRow({ vertical, items = [], loading = false }) {
  const skeletonContent = Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="sm:w-[300px] sm:shrink-0">
      <CardSkeleton />
    </div>
  ));

  const itemContent = items.map((item, i) => (
    <div key={item._id} className="sm:w-[300px] sm:shrink-0">
      <ListingCard vertical={vertical} item={item} index={i} />
    </div>
  ));

  const content = loading ? skeletonContent : itemContent;

  return (
    <div className="no-scrollbar grid grid-cols-2 gap-3 sm:-mx-0 sm:flex sm:gap-5 sm:overflow-x-auto sm:pb-2">
      {content}
    </div>
  );
}
