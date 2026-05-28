import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Star, Share2, CalendarDays, Languages,
  Building2, Leaf, Utensils, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DetailSkeleton } from '../components/ui/Skeleton.jsx';
import Badge from '../components/ui/Badge.jsx';
import { RatingPill } from '../components/ui/Rating.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import FavoriteButton from '../components/listing/FavoriteButton.jsx';
import ListingRow from '../components/listing/ListingRow.jsx';
import SectionHeader from '../components/listing/SectionHeader.jsx';
import BookingPanel from '../components/booking/BookingPanel.jsx';
import ReviewSection from '../components/common/ReviewSection.jsx';
import Gallery from '../components/common/Gallery.jsx';
import CountdownTimer from '../components/common/CountdownTimer.jsx';
import MapView from '../components/common/MapView.jsx';
import { listingApiFor } from '../api/listings.api.js';
import { VERTICAL_CONFIG, titleOf } from '../lib/listings.js';
import { formatCurrency, formatDateTime } from '../lib/format.js';
import { makeArtImage } from '../lib/visuals.js';

/* Card wrapper for a content block. */
function Block({ title, icon: Icon, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
        {Icon && <Icon className="h-5 w-5 text-brand-400" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function DiningSections({ item }) {
  return (
    <>
      {item.cuisine?.length > 0 && (
        <Block title="Cuisines & features">
          <div className="flex flex-wrap gap-2">
            {item.cuisine.map((c) => (
              <span key={c} className="chip chip-active">
                {c}
              </span>
            ))}
            {item.features?.map((f) => (
              <span key={f} className="chip">
                {f}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <Clock className="h-4 w-4 text-brand-400" /> {item.openHours}
          </p>
        </Block>
      )}

      {item.menu?.length > 0 && (
        <Block title="Menu highlights" icon={Utensils}>
          <div className="grid gap-3 sm:grid-cols-2">
            {item.menu.map((dish, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/50 p-2.5"
              >
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-white">
                    {dish.veg && <Leaf className="h-3 w-3 text-emerald-400" />}
                    {dish.name}
                  </p>
                  <p className="text-xs text-slate-500">{dish.category}</p>
                </div>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(dish.price)}
                </span>
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

function PlaySections({ item }) {
  return (
    <>
      <Block title="About the play">
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-400" /> {item.duration} mins
          </span>
          <span className="flex items-center gap-1.5">
            <Languages className="h-4 w-4 text-brand-400" /> {item.language}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-brand-400" /> {item.venue?.name}
          </span>
          <Badge tone="neutral">{item.ageRating}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.genre?.map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </div>
      </Block>

      {item.cast?.length > 0 && (
        <Block title="Cast">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {item.cast.map((member, i) => (
              <div key={i} className="w-24 shrink-0 text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-white/10"
                />
                <p className="mt-2 truncate text-xs font-medium text-white">{member.name}</p>
                <p className="truncate text-[11px] text-slate-500">{member.role}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

function EventSections({ item }) {
  return (
    <>
      <Block title="Event starts in" icon={CalendarDays}>
        <CountdownTimer target={item.startDate} />
        <p className="mt-4 text-sm text-slate-300">
          {formatDateTime(item.startDate)} · {item.venue?.name}
        </p>
        {item.organizer && (
          <p className="mt-1 text-sm text-slate-500">Organised by {item.organizer}</p>
        )}
      </Block>

      {item.lineup?.length > 0 && (
        <Block title="Line-up">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {item.lineup.map((act, i) => (
              <div key={i} className="w-24 shrink-0 text-center">
                <img
                  src={act.image}
                  alt={act.name}
                  className="mx-auto h-20 w-20 rounded-2xl object-cover ring-2 ring-white/10"
                />
                <p className="mt-2 truncate text-xs font-medium text-white">{act.name}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

export default function DetailPage({ vertical }) {
  const { slug } = useParams();
  const cfg = VERTICAL_CONFIG[vertical];
  const api = listingApiFor(vertical);

  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroSrc, setHeroSrc] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    window.scrollTo(0, 0);
    api
      .get(slug)
      .then((data) => {
        if (!active) return;
        setItem(data);
        api.similar(data._id).then((s) => active && setSimilar(s)).catch(() => {});
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, vertical]);

  useEffect(() => {
    if (!item) return;
    setHeroSrc(
      item.coverImage ||
        makeArtImage({
          theme: vertical,
          title: titleOf(item),
          subtitle: item.city,
          seed: item.slug || item._id,
          width: 1600,
          height: 900,
        }),
    );
  }, [item, vertical]);

  const share = async () => {
    try {
      await navigator.share?.({ title: titleOf(item), url: window.location.href });
    } catch {
      navigator.clipboard?.writeText(window.location.href);
      toast.success('Link copied');
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error || !item) {
    return (
      <div className="section py-20">
        <EmptyState
          title="Listing not found"
          description="It may have been removed or the link is incorrect."
          action={{ label: `Back to ${cfg.label}`, onClick: () => window.history.back() }}
        />
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Hero */}
      <div className="relative h-[340px] overflow-hidden sm:h-[420px]">
        <img
          src={heroSrc}
          alt={titleOf(item)}
          className="h-full w-full object-cover"
          onError={() => {
            const fallback = makeArtImage({
              theme: vertical,
              title: titleOf(item),
              subtitle: item.city,
              seed: `${item.slug || item._id}-fallback`,
              width: 1600,
              height: 900,
            });
            if (heroSrc !== fallback) setHeroSrc(fallback);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/20" />
        <div className="section absolute inset-x-0 bottom-0">
          <Link
            to={cfg.basePath}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All {cfg.label.toLowerCase()}
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-end justify-between gap-4 pb-6"
          >
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {item.isFeatured && <Badge tone="gold" icon={Star}>Featured</Badge>}
                {vertical === 'events' && <Badge tone="brand">{item.category}</Badge>}
              </div>
              <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                {titleOf(item)}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                {item.rating > 0 && <RatingPill value={item.rating} count={item.reviewCount} />}
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-brand-400" />
                  {item.venue?.address || item.address || item.city}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={share}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <FavoriteButton
                refType={cfg.refType}
                refId={item._id}
                className="h-10 w-10 bg-white/10 hover:bg-white/20"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="section grid gap-8 py-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Block title="Overview">
            <p className="text-sm leading-relaxed text-slate-300">{item.description}</p>
          </Block>

          {vertical === 'dining' && <DiningSections item={item} />}
          {vertical === 'plays' && <PlaySections item={item} />}
          {vertical === 'events' && <EventSections item={item} />}

          {item.gallery?.length > 0 && (
            <Block title="Gallery">
              <Gallery images={item.gallery} title={titleOf(item)} />
            </Block>
          )}

          {item.location && (
            <Block title="Location" icon={MapPin}>
              <MapView
                lat={item.location.lat}
                lng={item.location.lng}
                label={titleOf(item)}
              />
            </Block>
          )}

          <div className="card p-5 sm:p-6">
            <ReviewSection
              itemType={cfg.refType}
              itemId={item._id}
              initialReviews={item.reviews || []}
            />
          </div>
        </div>

        <div>
          <BookingPanel vertical={vertical} item={item} />
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="section mt-6">
          <SectionHeader title={`More ${cfg.label.toLowerCase()} you’ll like`} />
          <ListingRow vertical={vertical} items={similar} />
        </section>
      )}
    </div>
  );
}
