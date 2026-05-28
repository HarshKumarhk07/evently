import { Link } from 'react-router-dom';

/* Wordmark — use the provided favicon.png image as the monogram everywhere. */
export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Bookify home">
      <img src="/favicon.png" alt="Bookify" className="h-9 w-9 rounded-xl object-cover" />
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-white">
          Bookify
        </span>
      )}
    </Link>
  );
}
