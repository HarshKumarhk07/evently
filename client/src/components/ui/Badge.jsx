import { cn } from '../../lib/cn.js';

const tones = {
  brand: 'bg-brand-500/15 text-brand-200 border-brand-500/30',
  neutral: 'bg-white/[0.06] text-slate-300 border-white/[0.08]',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
  gold: 'bg-gold/15 text-gold border-gold/30',
};

export default function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}

/* Maps a booking status to a coloured badge. */
export function StatusBadge({ status }) {
  const map = {
    pending: ['warning', 'Pending'],
    confirmed: ['success', 'Confirmed'],
    cancelled: ['danger', 'Cancelled'],
    completed: ['brand', 'Completed'],
  };
  const [tone, label] = map[status] || ['neutral', status];
  return <Badge tone={tone}>{label}</Badge>;
}
