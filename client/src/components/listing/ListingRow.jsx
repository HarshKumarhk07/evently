import ListingCard from './ListingCard.jsx';
import { CardSkeleton } from '../ui/Skeleton.jsx';

/* Horizontally scrollable rail of listing cards — used on the home page. */
export default function ListingRow({ vertical, items = [], loading = false }) {
  const content = loading
    ? Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-[85vw] shrink-0 sm:w-[300px]">
          <CardSkeleton />
        </div>
      ))
    : items.map((item, i) => (
        <div key={item._id} className="w-[85vw] shrink-0 sm:w-[300px]">
          <ListingCard vertical={vertical} item={item} index={i} />
        </div>
      ));

  return (
    <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {content}
    </div>
  );
}
