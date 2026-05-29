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

/* Render the ticket onto a canvas and download it as a JPG. */
function downloadTicket(booking) {
  const W = 900;
  const H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  /* Background — gradient deep purple → pink to match the brand. */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1430');
  bg.addColorStop(1, '#2b1746');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Header band. */
  const header = ctx.createLinearGradient(0, 0, W, 0);
  header.addColorStop(0, '#7c3aed');
  header.addColorStop(1, '#ec4899');
  ctx.fillStyle = header;
  ctx.fillRect(0, 0, W, 180);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('Bookify', 60, 110);
  ctx.font = '28px sans-serif';
  ctx.fillText('Booking confirmation', 60, 150);

  /* Card body. */
  let y = 260;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(booking.itemTitle, 60, y);
  y += 50;
  ctx.fillStyle = '#9ca3af';
  ctx.font = '24px sans-serif';
  ctx.fillText(`${booking.itemType} · Ref ${booking.reference || booking._id}`, 60, y);

  const rows = [
    booking.reservation?.date && ['Date', booking.reservation.date],
    booking.reservation?.time && ['Time', booking.reservation.time],
    booking.reservation?.guests && ['Guests', String(booking.reservation.guests)],
    booking.showtime && ['Showtime', new Date(booking.showtime).toLocaleString()],
    ['Amount', booking.amount > 0 ? `Rs. ${booking.amount}` : 'Free'],
    ['Status', booking.status],
    ['Booked on', new Date(booking.createdAt).toLocaleString()],
  ].filter(Boolean);

  y += 80;
  rows.forEach(([label, value]) => {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '26px sans-serif';
    ctx.fillText(label, 60, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(value, 380, y);
    y += 60;
  });

  /* Footer. */
  ctx.fillStyle = '#6b7280';
  ctx.font = '22px sans-serif';
  ctx.fillText('Show this ticket at the venue.', 60, H - 80);
  ctx.fillStyle = '#7c3aed';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('bookify.app', W - 230, H - 80);

  canvas.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookify-${booking.reference || booking._id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    'image/jpeg',
    0.92,
  );
}

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
            onClick={() => downloadTicket(booking)}
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
