import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/* Title + optional eyebrow + "view all" link, used across home sections. */
export default function SectionHeader({ eyebrow, title, subtitle, to, linkLabel = 'View all' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200 sm:flex"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
