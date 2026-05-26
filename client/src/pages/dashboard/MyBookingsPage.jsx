import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Ticket } from 'lucide-react';
import Tabs from '../../components/ui/Tabs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import BookingCard from '../../components/dashboard/BookingCard.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { bookingsApi } from '../../api/bookings.api.js';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

export default function MyBookingsPage() {
  const [tab, setTab] = useState('upcoming');
  const { data, loading, setData } = useFetch(() => bookingsApi.mine({ limit: 50 }), []);
  const bookings = data?.items || [];

  const filtered = useMemo(() => {
    const now = Date.now();
    return bookings.filter((b) => {
      if (tab === 'all') return true;
      if (tab === 'cancelled') return b.status === 'cancelled';
      const when = new Date(b.showtime || b.reservation?.date || b.createdAt).getTime();
      const upcoming = when >= now - 86400000 && b.status !== 'cancelled';
      return tab === 'upcoming' ? upcoming : !upcoming && b.status !== 'cancelled';
    });
  }, [bookings, tab]);

  const cancel = async (id) => {
    try {
      const updated = await bookingsApi.cancel(id);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((b) => (b._id === id ? updated : b)),
      }));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.message || 'Could not cancel');
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">My Bookings</h1>
      <p className="mt-1 text-sm text-slate-400">
        Manage your reservations, tickets and booking history.
      </p>

      <Tabs className="mt-6" tabs={TABS} value={tab} onChange={setTab} />

      <div className="mt-6 space-y-4">
        {loading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No bookings here"
            description="When you book a table, play or event it will appear in this list."
          />
        ) : (
          filtered.map((booking) => (
            <BookingCard key={booking._id} booking={booking} onCancel={cancel} />
          ))
        )}
      </div>
    </div>
  );
}
