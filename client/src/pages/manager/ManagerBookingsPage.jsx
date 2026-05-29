import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { managerApi } from '../../api/manager.api.js';
import { formatCurrency, formatDate } from '../../lib/format.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/* Manager-facing bookings table — same shape as the admin one but scoped to
   the listings the current manager owns (server enforces ownership). */
export default function ManagerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    managerApi
      .myBookings()
      .then((d) => setBookings(d.items || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = status ? bookings.filter((b) => b.status === status) : bookings;

  return (
    <div className="section py-8">
      <div className="mb-4 flex items-center gap-2">
        <Button as={Link} to="/manager" variant="ghost" size="sm" icon={ArrowLeft}>
          Back to dashboard
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My bookings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Every booking made on your listings.
          </p>
        </div>
        <Select
          className="w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="mt-6 card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description={
              status
                ? 'No bookings match the selected status.'
                : 'Bookings on your listings will appear here in real-time.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.06] text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{b.itemTitle}</p>
                      <p className="text-xs text-slate-500">{b.reference}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {b.user?.name || b.contact?.name || '—'}
                      <p className="text-xs text-slate-500">
                        {b.user?.email || b.contact?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {b.amount > 0 ? formatCurrency(b.amount) : 'Free'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
