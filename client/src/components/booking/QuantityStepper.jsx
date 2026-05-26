import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/* Accessible +/- counter used for guests and ticket quantities. */
export default function QuantityStepper({ value, onChange, min = 0, max = 10, className }) {
  const set = (next) => onChange(Math.max(min, Math.min(max, next)));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Decrease"
        className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 text-slate-300 transition-colors hover:border-brand-500/50 hover:text-white disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Increase"
        className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 text-slate-300 transition-colors hover:border-brand-500/50 hover:text-white disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
