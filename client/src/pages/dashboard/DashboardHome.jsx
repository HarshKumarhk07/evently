import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Heart, Clock, ArrowRight, CalendarCheck } from 'lucide-react';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import BookingCard from '../../components/dashboard/BookingCard.jsx';
import ListingRow from '../../components/listing/ListingRow.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { bookingsApi } from '../../api/bookings.api.js';
import { usersApi } from '../../api/users.api.js';
import { REFTYPE_TO_VERTICAL } from '../../lib/listings.js';

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="card-interactive flex items-center gap-4 p-4">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </Link>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bookingData, loading } = useFetch(() => bookingsApi.mine({ limit: 5 }), []);
  const { data: recent } = useFetch(() => usersApi.recentlyViewed(), []);

  const bookings = bookingData?.items || [];
  const upcoming = bookings.filter((b) => b.status !== 'cancelled').slice(0, 3);
  const favCount = user?.favorites?.length || 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white">
          Hi, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here’s a quick look at your Bookify activity.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Ticket}
          label="Total bookings"
          value={bookingData?.pagination?.total ?? 0}
          to="/dashboard/bookings"
        />
        <StatCard icon={Heart} label="Saved favorites" value={favCount} to="/dashboard/favorites" />
        <StatCard
          icon={CalendarCheck}
          label="Upcoming"
          value={upcoming.length}
          to="/dashboard/bookings"
        />
      </div>

      {/* Upcoming bookings */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-white">Recent bookings</h2>
        <Link
          to="/dashboard/bookings"
          className="flex items-center gap-1 text-sm text-brand-300 hover:text-brand-200"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <CardSkeleton />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No bookings yet"
            description="Discover something great and make your first booking."
            action={{ label: 'Explore now', onClick: () => navigate('/') }}
          />
        ) : (
          upcoming.map((b) => <BookingCard key={b._id} booking={b} onCancel={() => {}} />)
        )}
      </div>

      {/* Recently viewed */}
      {recent?.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
            <Clock className="h-5 w-5 text-brand-400" /> Recently viewed
          </h2>
          <ListingRow
            vertical={REFTYPE_TO_VERTICAL[recent[0]._kind] || 'dining'}
            items={recent.map((r) => ({ ...r, _vertical: REFTYPE_TO_VERTICAL[r._kind] }))}
          />
        </div>
      )}
    </div>
  );
}
