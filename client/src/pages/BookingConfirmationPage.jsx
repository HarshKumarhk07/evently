import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, CalendarCheck, Ticket, Download, ArrowRight } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner.jsx';
import Button from '../components/ui/Button.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { bookingsApi } from '../api/bookings.api.js';
import { formatCurrency, formatDateTime, formatDate } from '../lib/format.js';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .get(id)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader label="Loading your booking" />;
  if (!booking) {
    return (
      <div className="section py-20">
        <EmptyState title="Booking not found" description="We couldn’t find this booking." />
      </div>
    );
  }

  const isDining = booking.itemType === 'Restaurant';

  return (
    <div className="section flex flex-col items-center py-12">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"
      >
        <CheckCircle2 className="h-11 w-11" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-5 text-center font-display text-3xl font-bold text-white"
      >
        {isDining ? 'Reservation confirmed!' : 'Booking confirmed!'}
      </motion.h1>
      <p className="mt-1.5 text-center text-sm text-slate-400">
        A confirmation has been sent to {booking.contact?.email}.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8 w-full max-w-md"
      >
        <div className="card overflow-hidden">
          {/* Ticket header */}
          <div className="relative bg-brand-gradient p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                {isDining ? <CalendarCheck className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                {booking.itemType}
              </span>
              <StatusBadge status={booking.status} />
            </div>
            <h2 className="mt-2 font-display text-xl font-bold text-white">
              {booking.itemTitle}
            </h2>
          </div>

          {/* Perforation */}
          <div className="relative h-5 bg-ink-800">
            <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-ink-950" />
            <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-ink-950" />
            <span className="absolute inset-x-4 top-1/2 border-t border-dashed border-ink-600" />
          </div>

          {/* Details */}
          <div className="divide-y divide-white/[0.05] px-5 pb-5">
            <Row label="Reference" value={booking.reference} />
            {isDining ? (
              <>
                <Row label="Date" value={formatDate(booking.reservation?.date)} />
                <Row label="Time" value={booking.reservation?.time} />
                <Row label="Guests" value={booking.reservation?.guests} />
              </>
            ) : (
              <>
                {booking.showtime && (
                  <Row label="Showtime" value={formatDateTime(booking.showtime)} />
                )}
                {booking.tickets?.map((t) => (
                  <Row
                    key={t.category}
                    label={`${t.category} × ${t.quantity}`}
                    value={formatCurrency(t.price * t.quantity)}
                  />
                ))}
              </>
            )}
            <Row
              label="Amount paid"
              value={booking.amount > 0 ? formatCurrency(booking.amount) : 'Free'}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            icon={Download}
            onClick={() => window.print()}
          >
            Save ticket
          </Button>
          <Button as={Link} to="/dashboard/bookings" fullWidth iconRight={ArrowRight}>
            My bookings
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
