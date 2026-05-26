import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/* Compact read-only rating pill: ★ 4.6 */
export function RatingPill({ value = 0, count, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300',
        className,
      )}
    >
      <Star className="h-3 w-3 fill-current" aria-hidden />
      {Number(value).toFixed(1)}
      {count != null && <span className="font-medium text-emerald-400/70">({count})</span>}
    </span>
  );
}

/* Five-star display. */
export function Stars({ value = 0, size = 'h-4 w-4' }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= Math.round(value) ? 'fill-gold text-gold' : 'text-ink-500')}
          aria-hidden
        />
      ))}
    </div>
  );
}

/* Interactive star input for the review form. */
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              n <= (hover || value) ? 'fill-gold text-gold' : 'text-ink-500',
            )}
          />
        </button>
      ))}
    </div>
  );
}
