import { Link } from 'react-router-dom';

/* Wordmark — a gradient "B" monogram plus the Bookify name. */
export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Bookify home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient font-display text-lg font-extrabold text-white shadow-glow">
        B
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-white">
          Bookify
        </span>
      )}
    </Link>
  );
}
