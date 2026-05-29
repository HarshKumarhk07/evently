import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Spinner } from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ListingGrid from '../components/listing/ListingGrid.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { navLinksApi } from '../api/navLinks.api.js';
import { listingApiFor } from '../api/listings.api.js';
import { customListingsApi } from '../api/customListings.api.js';
import { VERTICAL_CONFIG } from '../lib/listings.js';

/**
 * Renders a custom admin-created navbar destination like /c/sports.
 * Looks up the NavLink by slug, then queries the configured target
 * vertical (dining / plays / events) with the pre-applied filters.
 */
export default function DynamicCategoryPage() {
  const { slug } = useParams();
  const { city } = useLocation();
  const [config, setConfig] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* Fetch the admin-managed config for this slug. */
  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    navLinksApi
      .lookup(slug)
      .then(setConfig)
      .catch(() => {
        setConfig(null);
        setNotFound(true);
      });
  }, [slug]);

  /* Fetch the listings — either from the configured target vertical (with
     its saved filters) or, if this is a fully-standalone category, from the
     CustomListing collection scoped to this NavLink's _id. */
  useEffect(() => {
    if (!config) {
      setLoading(false);
      return;
    }
    const params = { limit: 24, sort: 'newest' };
    if (city?._id) params.cityId = city._id;
    if (city?.cityName) params.city = city.cityName;

    let api;
    if (config.targetVertical) {
      api = listingApiFor(config.targetVertical);
      Object.entries(config.filters || {}).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length) {
          params[key] = value.join(',');
        } else if (value && typeof value === 'string') {
          params[key] = value;
        }
      });
    } else {
      /* Standalone category — query CustomListings scoped to this NavLink. */
      api = customListingsApi;
      params.category = config._id;
    }
    if (!api) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .list(params)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [config, city]);

  if (notFound) {
    return (
      <div className="section py-16">
        <EmptyState
          title="Category not found"
          description="This navbar link no longer points anywhere. Check Admin → Categories → Navbar items."
        />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="section flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const cfg = VERTICAL_CONFIG[config.targetVertical];

  return (
    <div>
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-brand-500/20 via-ink-900 to-pink-500/10 sm:h-64">
        {config.heroImage && (
          <img
            src={config.heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
        <div className="section absolute inset-x-0 bottom-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
              {cfg?.label || 'Browse'}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
              {config.label}
            </h1>
            {config.heroSubtitle && (
              <p className="mt-1.5 max-w-lg text-sm text-slate-300">
                {config.heroSubtitle}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="section py-8">
        <ListingGrid
          vertical={config.targetVertical}
          items={items}
          loading={loading}
          empty={
            <EmptyState
              title={`No ${config.label.toLowerCase()} yet`}
              description="Listings matching this filter will appear here once they're added."
            />
          }
        />
      </div>
    </div>
  );
}
