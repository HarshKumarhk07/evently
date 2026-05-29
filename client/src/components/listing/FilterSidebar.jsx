import { useEffect, useState } from 'react';
import { Star, RotateCcw } from 'lucide-react';
import {
  CUISINES,
  PRICE_RANGES,
  RESTAURANT_FEATURES,
  PLAY_GENRES,
  EVENT_CATEGORIES,
} from '../../lib/constants.js';
import { categoriesApi } from '../../api/categories.api.js';
import { cn } from '../../lib/cn.js';

/* Filter groups available for each vertical. */
const CONFIG_BY_VERTICAL = (lists) => ({
  dining: [
    { key: 'cuisine', label: 'Cuisine', kind: 'multi', options: lists.cuisine },
    {
      key: 'priceBucket',
      label: 'Price Range',
      kind: 'single',
      options: PRICE_RANGES.map((p) => ({ value: p.value, label: p.label })),
    },
    { key: 'feature', label: 'Features', kind: 'multi', options: lists.feature },
  ],
  plays: [{ key: 'genre', label: 'Genre', kind: 'multi', options: lists.genre }],
  events: [{ key: 'category', label: 'Category', kind: 'multi', options: lists.category }],
});

/* Default lists used as a fallback while the API call is in-flight or if it
   fails — keeps the sidebar populated even on first paint. */
const FALLBACK = {
  cuisine: CUISINES,
  feature: RESTAURANT_FEATURES,
  genre: PLAY_GENRES,
  category: EVENT_CATEGORIES,
};

const KIND_BY_VERTICAL = {
  dining: ['cuisine', 'feature'],
  plays: ['genre'],
  events: ['category'],
};

function normalize(options) {
  return options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
}

/* Sidebar of chip-based filters; the parent owns the `filters` state. */
export default function FilterSidebar({ vertical, filters, onChange, onReset }) {
  const [lists, setLists] = useState(FALLBACK);

  /* Pull the admin-managed taxonomy for the kinds this vertical uses, then
     fall back to the bundled constants if the call fails. */
  useEffect(() => {
    const kinds = KIND_BY_VERTICAL[vertical] || [];
    let cancelled = false;
    Promise.all(
      kinds.map((kind) =>
        categoriesApi
          .list({ kind })
          .then((items) => [kind, items?.map((i) => i.name).filter(Boolean) || []])
          .catch(() => [kind, FALLBACK[kind]]),
      ),
    ).then((results) => {
      if (cancelled) return;
      setLists((prev) => {
        const next = { ...prev };
        results.forEach(([kind, names]) => {
          /* Empty response → keep the fallback so the sidebar isn't blank. */
          if (names?.length) next[kind] = names;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [vertical]);

  const groups = CONFIG_BY_VERTICAL(lists)[vertical] || [];

  const toggleMulti = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Filters</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-brand-300"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Rating */}
      <div>
        <p className="mb-2.5 text-sm font-medium text-slate-300">Minimum Rating</p>
        <div className="flex flex-wrap gap-2">
          {[4.5, 4, 3.5, 0].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, minRating: r })}
              className={cn('chip', filters.minRating === r && 'chip-active')}
            >
              {r === 0 ? (
                'Any'
              ) : (
                <>
                  <Star className="h-3 w-3 fill-current" />
                  {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-2.5 text-sm font-medium text-slate-300">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {normalize(group.options).map((opt) => {
              if (group.kind === 'single') {
                const active = filters[group.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      onChange({
                        ...filters,
                        [group.key]: active ? '' : opt.value,
                      })
                    }
                    className={cn('chip', active && 'chip-active')}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              }
              const active = (filters[group.key] || []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(group.key, opt.value)}
                  className={cn('chip', active && 'chip-active')}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
