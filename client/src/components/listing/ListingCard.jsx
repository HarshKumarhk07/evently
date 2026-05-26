import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, Clock, CalendarDays } from 'lucide-react';
import LazyImage from '../ui/LazyImage.jsx';
import Badge from '../ui/Badge.jsx';
import { RatingPill } from '../ui/Rating.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import { VERTICAL_CONFIG, titleOf, priceFrom } from '../../lib/listings.js';
import { formatCurrency, formatDate, priceRangeLabel } from '../../lib/format.js';
import { makeArtImage } from '../../lib/visuals.js';

/* The meta line below the title differs per vertical. */
function MetaRow({ vertical, item }) {
  if (vertical === 'dining') {
    return (
      <span className="truncate">
        {(item.cuisine || []).slice(0, 2).join(' · ') || 'Restaurant'}
      </span>
    );
  }
  if (vertical === 'plays') {
    return (
      <span className="flex items-center gap-1.5 truncate">
        {(item.genre || [])[0] || 'Theatre'}
        <span className="text-slate-600">•</span>
        <Clock className="h-3 w-3" />
        {item.duration}m
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 truncate">
      <CalendarDays className="h-3 w-3" />
      {formatDate(item.startDate)}
    </span>
  );
}

function PriceTag({ vertical, item }) {
  if (vertical === 'dining') {
    return (
      <span className="text-sm font-semibold text-white">
        {formatCurrency(item.costForTwo)}
        <span className="ml-1 text-xs font-normal text-slate-500">for two</span>
      </span>
    );
  }
  return (
    <span className="text-sm font-semibold text-white">
      {formatCurrency(priceFrom(item))}
      <span className="ml-1 text-xs font-normal text-slate-500">onwards</span>
    </span>
  );
}

/* Unified, animated card for restaurants, plays and events.
   `item._vertical` (set on mixed lists) overrides the `vertical` prop. */
export default function ListingCard({ vertical: verticalProp, item, index = 0 }) {
  const vertical = item._vertical || verticalProp;
  const cfg = VERTICAL_CONFIG[vertical];
  const href = `${cfg.basePath}/${item.slug}`;
  const fallbackImage = makeArtImage({
    theme: vertical,
    title: titleOf(item),
    subtitle: item.city,
    seed: item.slug || item._id || `${vertical}-${index}`,
    width: 1200,
    height: 800,
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link to={href} className="card-interactive group block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <LazyImage
            src={item.coverImage || fallbackImage}
            alt={titleOf(item)}
            className="h-full w-full"
            imgClassName="group-hover:scale-110 transition-transform duration-[800ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          <div className="absolute left-3 top-3 flex gap-2">
            {item.isFeatured && (
              <Badge tone="gold" icon={Sparkles}>
                Featured
              </Badge>
            )}
            {vertical === 'events' && item.category && (
              <Badge tone="brand">{item.category}</Badge>
            )}
          </div>

          <div className="absolute right-3 top-3">
            <FavoriteButton refType={cfg.refType} refId={item._id} />
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {item.rating > 0 && <RatingPill value={item.rating} count={item.reviewCount} />}
            {vertical === 'dining' && (
              <span className="rounded-lg bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                {priceRangeLabel(item.priceRange)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 p-4">
          <h3 className="truncate font-display text-base font-semibold text-white transition-colors group-hover:text-brand-200">
            {titleOf(item)}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <MetaRow vertical={vertical} item={item} />
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {item.city}
            </span>
            <PriceTag vertical={vertical} item={item} />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
