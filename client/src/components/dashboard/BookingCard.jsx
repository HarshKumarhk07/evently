import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, Ticket, Hash } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Badge, { StatusBadge } from '../ui/Badge.jsx';
import ConfirmDialog from '../feedback/ConfirmDialog.jsx';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format.js';

/* A single booking row used in the dashboard and booking history. */
export default function BookingCard({ booking, onCancel }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const isDining = booking.itemType === 'Restaurant';
  const cancellable = ['pending', 'confirmed'].includes(booking.status);

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(booking._id);
    setCancelling(false);
    setConfirmOpen(false);
  };

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <img
        src={booking.itemImage}
        alt={booking.itemTitle}
        className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-28"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{booking.itemType}</Badge>
          <StatusBadge status={booking.status} />
        </div>
        <h3 className="mt-1.5 truncate font-display text-base font-semibold text-white">
          {booking.itemTitle}
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {isDining ? (
            <>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(booking.reservation?.date)} · {booking.reservation?.time}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {booking.reservation?.guests} guests
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5" />
              {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
              {booking.showtime && ` · ${formatDateTime(booking.showtime)}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5" />
            {booking.reference}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span className="font-display text-lg font-bold text-white">
          {booking.amount > 0 ? formatCurrency(booking.amount) : 'Free'}
        </span>
        <div className="flex gap-2">
          <Button
            as={Link}
            to={`/booking/${booking._id}/confirmation`}
            variant="secondary"
            size="sm"
          >
            View
          </Button>
          {cancellable && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this booking?"
        description="This cannot be undone. Paid bookings will be marked for refund."
        confirmLabel="Cancel booking"
        loading={cancelling}
        danger
      />
    </div>
  );
}
