import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input, Select } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import ListingGrid from '../components/listing/ListingGrid.jsx';
import FilterSidebar from '../components/listing/FilterSidebar.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { useLocation } from '../context/LocationContext.jsx';
import { listingApiFor } from '../api/listings.api.js';
import { SORT_OPTIONS, PRICE_RANGES } from '../lib/constants.js';

const HERO = {
  dining: {
    title: 'Dining',
    subtitle: 'Tonight’s table is waiting — from rooftop bars to chef’s counters.',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
  },
  plays: {
    title: 'Plays',
    subtitle: 'Drama, comedy and classics staged across the city’s finest theatres.',
    image: '/play%20cover.jpg',
  },
  events: {
    title: 'Events',
    subtitle: 'Concerts, comedy, festivals and workshops — all in one place.',
    image: '/eventCover.jpg',
  },
};

const emptyFilters = {
  search: '',
  sort: 'newest',
  minRating: 0,
  cuisine: [],
  priceBucket: '',
  feature: [],
  genre: [],
  category: [],
};

/* Builds API query params from the active filter state. */
function toParams(filters, city, page) {
  const params = { page, limit: 12 };
  if (city?._id) params.cityId = city._id;
  else if (city?.cityName) params.city = city.cityName;
  if (filters.search) params.search = filters.search;
  if (filters.sort) params.sort = filters.sort;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.priceBucket) {
    const bucket = PRICE_RANGES.find((p) => p.value === filters.priceBucket);
    if (bucket) {
      if (bucket.min != null) params.costMin = bucket.min;
      if (bucket.max != null) params.costMax = bucket.max;
    }
  }
  ['cuisine', 'feature', 'genre', 'category'].forEach((key) => {
    if (filters[key]?.length) params[key] = filters[key].join(',');
  });
  return params;
}

/* Shared explorer page powering /dining, /plays and /events. */
export default function ListingPage({ vertical }) {
  const hero = HERO[vertical];
  const api = listingApiFor(vertical);
  const { city } = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ hasMore: false, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const reqId = useRef(0);

  /* Fold the debounced search box into the filter object. */
  useEffect(() => {
    setFilters((f) => ({ ...f, search: debouncedSearch }));
  }, [debouncedSearch]);

  /* Refetch from page 1 whenever filters or city change. */
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setPage(1);
    api
      .list(toParams(filters, city, 1))
      .then((data) => {
        if (id !== reqId.current) return;
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch(() => id === reqId.current && setItems([]))
      .finally(() => id === reqId.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, city, vertical]);

  const loadMore = useCallback(() => {
    if (loadingMore || !pagination.hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    api
      .list(toParams(filters, city, next))
      .then((data) => {
        setItems((prev) => [...prev, ...data.items]);
        setPagination(data.pagination);
        setPage(next);
      })
      .finally(() => setLoadingMore(false));
  }, [api, filters, city, page, pagination.hasMore, loadingMore]);

  const sentinelRef = useInfiniteScroll({
    hasMore: pagination.hasMore,
    loading: loading || loadingMore,
    onLoadMore: loadMore,
  });

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSearchInput('');
  };

  const sidebar = (
    <FilterSidebar
      vertical={vertical}
      filters={filters}
      onChange={setFilters}
      onReset={resetFilters}
    />
  );

  return (
    <div>
      {/* Hero band */}
      <div className="relative h-56 overflow-hidden sm:h-64">
        <img src={hero.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
        <div className="section absolute inset-x-0 bottom-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-6"
          >
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              {hero.title}
              {city?.cityName ? ` in ${city.cityName}` : ''}
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-slate-300">{hero.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="section py-8">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder={`Search ${hero.title.toLowerCase()}…`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select
              className="w-44"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              options={SORT_OPTIONS}
            />
            {!isDesktop && (
              <Button
                variant="secondary"
                icon={SlidersHorizontal}
                onClick={() => setFilterOpen(true)}
              >
                Filters
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {isDesktop && (
            <aside className="w-64 shrink-0">
              <div className="sticky top-20 card p-5">{sidebar}</div>
            </aside>
          )}

          <div className="min-w-0 flex-1">
            <p className="mb-4 text-sm text-slate-500">
              {loading ? 'Searching…' : `${pagination.total} result${pagination.total === 1 ? '' : 's'}`}
            </p>

            <ListingGrid vertical={vertical} items={items} loading={loading} />

            <div ref={sentinelRef} className="h-12" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" size="sm">
        {sidebar}
        <Button fullWidth className="mt-6" onClick={() => setFilterOpen(false)}>
          Show {pagination.total} results
        </Button>
      </Modal>
    </div>
  );
}
