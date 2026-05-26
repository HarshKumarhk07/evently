import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Ticket } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Input, Select } from '../ui/Input.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import BookingModal from './BookingModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { VERTICAL_CONFIG } from '../../lib/listings.js';
import { formatCurrency, formatDateTime } from '../../lib/format.js';

const TIME_SLOTS = ['12:30 PM', '1:30 PM', '2:30 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];
const today = () => new Date().toISOString().split('T')[0];

/* Sticky booking widget — adapts its form to the vertical. */
export default function BookingPanel({ vertical, item }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const cfg = VERTICAL_CONFIG[vertical];

  /* Dining state */
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(TIME_SLOTS[3]);
  const [guests, setGuests] = useState(2);

  /* Plays / events state */
  const pools = vertical === 'plays' ? item.seatCategories : item.ticketTypes;
  const [showtimeIdx, setShowtimeIdx] = useState(0);
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries((pools || []).map((p) => [p._id, 0])),
  );

  const [modalOpen, setModalOpen] = useState(false);

  const selectedTickets = useMemo(() => {
    if (vertical === 'dining') return [];
    return (pools || [])
      .filter((p) => quantities[p._id] > 0)
      .map((p) => ({ category: p.name, price: p.price, quantity: quantities[p._id] }));
  }, [vertical, pools, quantities]);

  const total = selectedTickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
  const ticketCount = selectedTickets.reduce((sum, t) => sum + t.quantity, 0);

  const buildDraft = () => {
    const base = { vertical, item, itemType: cfg.refType, itemId: item._id };
    if (vertical === 'dining') {
      return { ...base, amount: 0, reservation: { date, time, guests } };
    }
    return {
      ...base,
      amount: total,
      tickets: selectedTickets,
      showtime: vertical === 'plays' ? item.showtimes?.[showtimeIdx] : undefined,
    };
  };

  const openBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setModalOpen(true);
  };

  const canBook = vertical === 'dining' ? Boolean(date && time) : ticketCount > 0;

  return (
    <div className="card sticky top-20 p-5">
      {vertical === 'dining' ? (
        <>
          <h3 className="font-display text-lg font-semibold text-white">Reserve a table</h3>
          <p className="mt-1 text-sm text-slate-400">Free to book · instant confirmation</p>

          <div className="mt-4 space-y-3">
            <Input
              type="date"
              label="Date"
              icon={Calendar}
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Time"
              icon={Clock}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
            />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                <Users className="h-4 w-4" /> Guests
              </p>
              <QuantityStepper value={guests} onChange={setGuests} min={1} max={20} />
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-display text-lg font-semibold text-white">
            {vertical === 'plays' ? 'Book your seats' : 'Get tickets'}
          </h3>

          {vertical === 'plays' && item.showtimes?.length > 0 && (
            <Select
              className="mt-4"
              label="Showtime"
              value={showtimeIdx}
              onChange={(e) => setShowtimeIdx(Number(e.target.value))}
              options={item.showtimes.map((s, i) => ({
                value: i,
                label: formatDateTime(s),
              }))}
            />
          )}

          <div className="mt-4 space-y-2.5">
            {(pools || []).map((pool) => {
              const sold = pool.bookedSeats ?? pool.soldQuantity ?? 0;
              const cap = pool.totalSeats ?? pool.totalQuantity ?? 0;
              const left = cap - sold;
              return (
                <div
                  key={pool._id}
                  className="flex items-center justify-between rounded-xl border border-ink-600 bg-ink-900/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{pool.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(pool.price)}
                      {left <= 20 && (
                        <span className="ml-1.5 text-amber-400">· {left} left</span>
                      )}
                    </p>
                  </div>
                  <QuantityStepper
                    value={quantities[pool._id] || 0}
                    onChange={(v) => setQuantities((q) => ({ ...q, [pool._id]: v }))}
                    min={0}
                    max={Math.min(8, left)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        {vertical !== 'dining' && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Total {ticketCount > 0 && `· ${ticketCount} ticket${ticketCount > 1 ? 's' : ''}`}
            </span>
            <span className="font-display text-xl font-bold text-white">
              {formatCurrency(total)}
            </span>
          </div>
        )}
        <Button fullWidth size="lg" icon={Ticket} disabled={!canBook} onClick={openBooking}>
          {vertical === 'dining' ? 'Reserve table' : 'Proceed to book'}
        </Button>
      </div>

      {modalOpen && (
        <BookingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          draft={buildDraft()}
        />
      )}
    </div>
  );
}
