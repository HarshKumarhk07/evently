import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, ChevronDown, Check, Search, Crosshair, X, Loader2,
  Landmark, Castle, Building2, TreePalm,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLocation } from '../../context/LocationContext.jsx';
import { cn } from '../../lib/cn.js';

/* A small lucide icon per popular city — gives the grid the visual variety
   the District-style picker has, without bundling custom illustrations. */
const CITY_ICON = {
  'Abu Dhabi':  Building2,
  Ahmedabad:    Landmark,
  Bengaluru:    Landmark,
  Chandigarh:   Landmark,
  Chennai:      Landmark,
  Delhi:        Castle,
  Dubai:        Building2,
  Goa:          TreePalm,
  Hyderabad:    Landmark,
  Kolkata:      Landmark,
  Mumbai:       Landmark,
  Pune:         Castle,
};
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function pickNearestCityFromList(list = [], lat, lng) {
  if (!list || !list.length) return null;
  let best = list[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const c of list) {
    let clat = 0;
    let clng = 0;
    if (c.location?.coordinates?.length === 2) {
      clng = c.location.coordinates[0];
      clat = c.location.coordinates[1];
    } else if (c.lat !== undefined && c.lng !== undefined) {
      clat = c.lat;
      clng = c.lng;
    }
    const score = (clat - lat) ** 2 + (clng - lng) ** 2;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best?.cityName || null;
}

/* City picker shown on the left of the navbar. */
export default function LocationSelector() {
  const { cities, city, setCity, detectNearest } = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('A');
  const [detecting, setDetecting] = useState(false);

  /* Reset transient state when the modal closes. */
  useEffect(() => {
    if (!open) {
      setQuery('');
      setLetter('A');
    }
  }, [open]);

  /* Body scroll lock + Esc to close. */
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const trimmed = query.trim().toLowerCase();
  const searching = trimmed.length > 0;

  /* Search filters both popular and all-cities. The A–Z letter filter
     only applies when there's no active search. */
  const popularFiltered = useMemo(() => {
    const popular = cities.filter((c) => c.isPopular);
    return searching
      ? popular.filter((c) => c.cityName.toLowerCase().includes(trimmed))
      : popular;
  }, [cities, searching, trimmed]);

  const allNames = useMemo(() => cities.map((c) => c.cityName), [cities]);

  const allFiltered = useMemo(() => {
    if (searching) return allNames.filter((n) => n.toLowerCase().includes(trimmed));
    return allNames.filter((n) => n[0]?.toUpperCase() === letter);
  }, [allNames, searching, trimmed, letter]);

  const activeLetters = useMemo(
    () => new Set(allNames.map((c) => c[0]?.toUpperCase()).filter(Boolean)),
    [allNames],
  );

  const select = (nextName) => {
    const next = cities.find((c) => c.cityName === nextName);
    if (next) {
      setCity(next);
      setOpen(false);
      toast.success(`Switched to ${next.cityName}`);
    } else {
      toast.error('City not found');
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const found = await detectNearest(position.coords.latitude, position.coords.longitude);
          setDetecting(false);
          if (found) {
            setCity(found);
            setOpen(false);
            toast.success(`Detected ${found.cityName}`);
            return;
          }
          // fallback to client-side nearest
          const f = pickNearestCityFromList(cities, position.coords.latitude, position.coords.longitude);
          if (f) select(f);
        } catch (err) {
          setDetecting(false);
          toast.error('Could not detect your location');
        }
      },
      () => {
        setDetecting(false);
        toast.error('Could not detect your location');
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  /* Portal is mounted unconditionally so AnimatePresence sees the motion.div
     as its direct child and can actually mount/animate it. */
  const panel = createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="loc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-[min(94vw,960px)] flex-col overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-[0_40px_120px_rgba(0,0,0,.45)]"
          >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Select Location</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the city that matches your night out.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close location picker"
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto px-6 py-6 sm:px-8">
                {/* Search */}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 transition-colors focus-within:border-brand-400 focus-within:bg-white">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search city, area or locality"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>

                {/* Use current location */}
                <button
                  onClick={useCurrentLocation}
                  disabled={detecting}
                  className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-60"
                >
                  {detecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-600">
                      <Crosshair className="h-4 w-4" />
                    </span>
                  )}
                  {detecting ? 'Detecting…' : 'Use Current Location'}
                </button>

                {/* Popular Cities */}
                <div className="mt-7">
                  <h3 className="text-base font-semibold text-slate-900">Popular Cities</h3>
                  {popularFiltered.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      No popular city matches “{query}”.
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                      {popularFiltered.map((c) => {
                        const Icon = CITY_ICON[c.cityName] || Landmark;
                        const selected = c.cityName === city?.cityName;
                        return (
                          <button
                            key={c.cityName}
                            onClick={() => select(c.cityName)}
                            className={cn(
                              'group flex flex-col items-center justify-center rounded-2xl border px-2 py-4 text-center transition-all',
                              selected
                                ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-[0_16px_30px_rgba(124,58,237,.15)]'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white',
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-14 w-14 place-items-center rounded-2xl transition-colors',
                                selected
                                  ? 'bg-white text-brand-600'
                                  : 'bg-white text-brand-500 group-hover:text-brand-600',
                              )}
                            >
                              <Icon strokeWidth={1.4} className="h-7 w-7" />
                            </span>
                            <span className="mt-2.5 text-sm font-semibold">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* All Cities */}
                <div className="mt-8">
                  <h3 className="text-base font-semibold text-slate-900">All Cities</h3>

                  {/* A–Z bar (hidden while searching) */}
                  {!searching && (
                    <div className="mt-3 flex flex-wrap gap-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                      {ALPHABET.map((L) => {
                        const has = activeLetters.has(L);
                        const active = L === letter;
                        return (
                          <button
                            key={L}
                            disabled={!has}
                            onClick={() => setLetter(L)}
                            className={cn(
                              'rounded-md px-1.5 py-0.5 transition-colors',
                              active
                                ? 'text-brand-600'
                                : has
                                  ? 'text-slate-500 hover:text-brand-600'
                                  : 'text-slate-300',
                            )}
                          >
                            {L}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {allFiltered.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-6 sm:grid-cols-3 md:grid-cols-4">
                      {allFiltered.map((name) => {
                        const selected = name === city?.cityName;
                        return (
                          <button
                            key={name}
                            onClick={() => select(name)}
                            className={cn(
                              'flex items-center justify-between truncate py-1.5 text-left text-sm transition-colors',
                              selected
                                ? 'font-semibold text-brand-600'
                                : 'text-slate-700 hover:text-brand-600',
                            )}
                          >
                            <span className="truncate">{name}</span>
                            {selected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      {searching
                        ? `No cities match “${query}”.`
                        : `No cities under “${letter}”.`}
                    </p>
                  )}
                </div>
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm transition-colors hover:border-brand-500/40"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MapPin className="h-4 w-4 text-brand-400" />
        <span className="hidden font-medium text-white sm:inline">{city?.cityName || 'Select city'}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {panel}
    </>
  );
}
