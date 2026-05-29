import { motion } from 'framer-motion';
import { Users, Store, Drama, Ticket, IndianRupee, TrendingUp } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminApi } from '../../api/admin.api.js';
import { formatCurrency, formatDate } from '../../lib/format.js';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </motion.div>
  );
}

/* Lightweight CSS bar chart for the 7-day booking trend. Pads missing days
   with zero-bars so the x-axis is always a full week. */
function TrendChart({ trend }) {
  /* Build a complete 7-day window so the chart is never empty-looking. */
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const found = trend.find((t) => t._id === key);
    return { key, label: d.toLocaleDateString('en-IN', { weekday: 'short' }), count: found?.count || 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex h-44 items-end gap-2">
        {days.map((d) => {
          const pct = Math.max(2, (d.count / max) * 100); // min 2% so empty bars still show as a sliver
          return (
            <div key={d.key} className="group flex flex-1 flex-col items-stretch">
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-brand-gradient transition-[height] duration-500"
                  style={{ height: `${pct}%`, opacity: d.count === 0 ? 0.25 : 1 }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {d.count}
                  </span>
                </div>
              </div>
              <span className="mt-2 text-center text-[10px] text-slate-500">{d.label}</span>
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="mt-3 text-center text-xs text-slate-500">
          No bookings yet in the last 7 days.
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading } = useFetch(() => adminApi.stats(), []);

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const { totals, revenue, trend, recentBookings, bookingsByStatus } = data;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
      <p className="mt-1 text-sm text-slate-400">Platform performance at a glance.</p>

      {/* Stat grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={IndianRupee}
          label="Revenue"
          value={formatCurrency(revenue)}
          accent="bg-emerald-500/15 text-emerald-300"
        />
        <StatCard
          icon={Ticket}
          label="Bookings"
          value={totals.bookings}
          accent="bg-brand-500/15 text-brand-300"
        />
        <StatCard
          icon={Users}
          label="Users"
          value={totals.users}
          accent="bg-sky-500/15 text-sky-300"
        />
        <StatCard
          icon={Store}
          label="Restaurants"
          value={totals.restaurants}
          accent="bg-amber-500/15 text-amber-300"
        />
        <StatCard
          icon={Drama}
          label="Plays"
          value={totals.plays}
          accent="bg-pink-500/15 text-pink-300"
        />
        <StatCard
          icon={Ticket}
          label="Events"
          value={totals.events}
          accent="bg-violet-500/15 text-violet-300"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Trend chart */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
            <TrendingUp className="h-4 w-4 text-brand-400" /> Bookings — last 7 days
          </h2>
          <TrendChart trend={trend} />
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-bold text-white">Bookings by status</h2>
          <div className="space-y-3">
            {['confirmed', 'pending', 'completed', 'cancelled'].map((status) => {
              const count = bookingsByStatus[status] || 0;
              const pct = totals.bookings ? (count / totals.bookings) * 100 : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <StatusBadge status={status} />
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="mt-6 card p-5">
        <h2 className="mb-4 font-display text-base font-bold text-white">Recent bookings</h2>
        <div className="space-y-2">
          {recentBookings.map((b) => (
            <div
              key={b._id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-ink-900/50 p-3"
            >
              <Avatar name={b.user?.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{b.itemTitle}</p>
                <p className="truncate text-xs text-slate-500">
                  {b.user?.name} · {formatDate(b.createdAt)}
                </p>
              </div>
              <span className="text-sm font-semibold text-white">
                {b.amount > 0 ? formatCurrency(b.amount) : 'Free'}
              </span>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
