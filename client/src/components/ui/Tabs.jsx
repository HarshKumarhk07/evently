import { motion } from 'framer-motion';
import { cn } from '../../lib/cn.js';

/* Animated underline tab bar driven by a controlled `value`. */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div
      className={cn('flex gap-1 overflow-x-auto no-scrollbar border-b border-ink-600', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const key = tab.value ?? tab;
        const label = tab.label ?? tab;
        const active = key === value;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-white' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs text-slate-500">{tab.count}</span>
            )}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-gradient"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
