import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { adminApi } from '../../api/admin.api.js';
import { formatCurrency, formatDate } from '../../lib/format.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ hasMore: false, pages: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .bookings({ status, page })
      .then((d) => {
        setBookings(d.items);
        setPagination(d.pagination);
      })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(load, [load]);

  const changeStatus = async (id, next) => {
    try {
      const updated = await adminApi.updateBooking(id, next);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: updated.status } : b)));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-slate-400">Every booking across the platform.</p>
        </div>
        <Select
          className="w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
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
        ) : bookings.length === 0 ? (
          <EmptyState title="No bookings found" />
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
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{b.itemTitle}</p>
                      <p className="text-xs text-slate-500">{b.reference}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {b.user?.name || '—'}
                      <p className="text-xs text-slate-500">{b.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {b.amount > 0 ? formatCurrency(b.amount) : 'Free'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        <select
                          value={b.status}
                          onChange={(e) => changeStatus(b._id, e.target.value)}
                          className="rounded-lg border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-white"
                        >
                          {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-400">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
