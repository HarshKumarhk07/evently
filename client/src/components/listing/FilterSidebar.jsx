import { Star, RotateCcw } from 'lucide-react';
import {
  CUISINES,
  PRICE_RANGES,
  RESTAURANT_FEATURES,
  PLAY_GENRES,
  EVENT_CATEGORIES,
} from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';

/* Filter groups available for each vertical. */
const CONFIG = {
  dining: [
    { key: 'cuisine', label: 'Cuisine', kind: 'multi', options: CUISINES },
    {
      key: 'priceRange',
      label: 'Price Range',
      kind: 'multi',
      options: PRICE_RANGES.map((p) => ({ value: p.value, label: p.label })),
    },
    { key: 'feature', label: 'Features', kind: 'multi', options: RESTAURANT_FEATURES },
  ],
  plays: [{ key: 'genre', label: 'Genre', kind: 'multi', options: PLAY_GENRES }],
  events: [{ key: 'category', label: 'Category', kind: 'multi', options: EVENT_CATEGORIES }],
};

function normalize(options) {
  return options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
}

/* Sidebar of chip-based filters; the parent owns the `filters` state. */
export default function FilterSidebar({ vertical, filters, onChange, onReset }) {
  const groups = CONFIG[vertical] || [];

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
