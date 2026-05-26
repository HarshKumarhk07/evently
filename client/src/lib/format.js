export const formatCurrency = (amount = 0) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const formatDate = (date, opts = {}) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatDateTime = (date) => `${formatDate(date)} · ${formatTime(date)}`;

/* "in 3 days", "2 hours ago" — for countdowns and recency. */
export function relativeTime(date) {
  const diff = new Date(date).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) {
      const value = Math.round(diff / ms);
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit);
    }
  }
  return 'just now';
}

export const priceRangeLabel = (range = 2) => '₹'.repeat(Math.max(1, Math.min(4, range)));

export const initialsOf = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
