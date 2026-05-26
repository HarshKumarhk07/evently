import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavorites } from '../../hooks/useFavorites.js';
import { cn } from '../../lib/cn.js';

/* Heart toggle wired to the wishlist hook. */
export default function FavoriteButton({ refType, refId, className }) {
  const { isFavorite, toggle, pending } = useFavorites();
  const active = isFavorite(refType, refId);

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(refType, refId);
      }}
      disabled={pending === refId}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-colors',
        active
          ? 'bg-red-500/90 text-white'
          : 'bg-black/45 text-white hover:bg-black/65',
        className,
      )}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-current')} />
    </motion.button>
  );
}
