import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, Users, Ticket } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import PaymentStep from './PaymentStep.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { bookingsApi } from '../../api/bookings.api.js';
import { titleOf } from '../../lib/listings.js';
import { formatCurrency, formatDateTime } from '../../lib/format.js';

/* Two-step booking flow: confirm details → pay → confirmation page. */
export default function BookingModal({ open, onClose, draft }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('details');
  const [contact, setContact] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null); // { booking, payment }

  const isDining = draft.vertical === 'dining';

  const validate = () => {
    const e = {};
    if (!contact.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) e.email = 'Valid email required';
    if (contact.phone.trim().length < 6) e.phone = 'Valid phone required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finish = (booking) => {
    onClose();
    navigate(`/booking/${booking._id}/confirmation`);
  };

  const submitDetails = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        itemType: draft.itemType,
        itemId: draft.itemId,
        contact,
        ...(isDining
          ? { reservation: draft.reservation }
          : { tickets: draft.tickets, showtime: draft.showtime }),
      };
      const result = await bookingsApi.create(payload);
      setCreated(result);

      if (!result.payment) {
        toast.success('Reservation confirmed');
        finish(result.booking);
        return;
      }
      setStep('payment');
    } catch (err) {
      toast.error(err.message || 'Could not create booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePaid = async (verification) => {
    setLoading(true);
    try {
      const booking = await bookingsApi.confirm(created.booking._id, verification);
      toast.success('Payment successful');
      finish(booking);
    } catch (err) {
      toast.error(err.message || 'Payment confirmation failed');
      setLoading(false);
    }
  };

  /* Called when the user closes the Razorpay window without paying or
     when the payment fails — flip the pending booking to cancelled so the
     manager/admin tables don't show it stuck on "pending" forever. */
  const handleDismiss = async (reason) => {
    if (!created?.booking?._id) return;
    try {
      await bookingsApi.cancel(created.booking._id);
    } catch (err) {
      /* Best-effort — even if cancel fails the user has already left the flow. */
    }
    toast.error(
      reason === 'failed'
        ? 'Payment failed — booking cancelled'
        : 'Payment cancelled',
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 'payment' ? 'Secure checkout' : 'Confirm your booking'}
      size="md"
    >
      {step === 'details' && (
        <div className="space-y-5">
          {/* Selection summary */}
          <div className="rounded-2xl bg-ink-900/70 p-4">
            <p className="font-display text-base font-semibold text-white">
              {titleOf(draft.item)}
            </p>
            {isDining ? (
              <div className="mt-2 space-y-1 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-brand-400" />
                  {draft.reservation.date} · {draft.reservation.time}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-400" />
                  {draft.reservation.guests} guest{draft.reservation.guests > 1 ? 's' : ''}
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-1.5 text-sm">
                {draft.showtime && (
                  <p className="text-slate-400">{formatDateTime(draft.showtime)}</p>
                )}
                {draft.tickets.map((t) => (
                  <p key={t.category} className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <Ticket className="h-3.5 w-3.5 text-brand-400" />
                      {t.category} × {t.quantity}
                    </span>
                    <span>{formatCurrency(t.price * t.quantity)}</span>
                  </p>
                ))}
                <p className="flex justify-between border-t border-white/[0.06] pt-2 font-semibold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(draft.amount)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Contact details */}
          <div className="space-y-3">
            <Input
              label="Full name"
              value={contact.name}
              error={errors.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={contact.email}
              error={errors.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={contact.phone}
              error={errors.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
          </div>

          <Button fullWidth size="lg" loading={loading} onClick={submitDetails}>
            {isDining ? 'Confirm reservation' : `Continue to payment`}
          </Button>
        </div>
      )}

      {step === 'payment' && created?.payment && (
        <PaymentStep
          booking={created.booking}
          payment={created.payment}
          onSuccess={handlePaid}
          onDismiss={handleDismiss}
        />
      )}
    </Modal>
  );
}
