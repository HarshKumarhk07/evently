import { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { formatCurrency } from '../../lib/format.js';
import { loadRazorpay } from '../../lib/razorpay.js';

/**
 * Razorpay checkout step.
 *  - With keys configured the backend returns a real `razorpay` order and
 *    this opens the hosted Razorpay Checkout (cards, UPI, netbanking…).
 *  - With no keys the backend issues a `mock` order and this simulated card
 *    form keeps the booking flow testable end-to-end.
 *
 * `onSuccess` receives the verification payload the server needs to confirm:
 * `{ razorpayPaymentId, razorpayOrderId, razorpaySignature }`.
 */
export default function PaymentStep({ booking, payment, onSuccess }) {
  const amount = booking.amount;
  const isMock = payment.provider === 'mock';
  const [processing, setProcessing] = useState(false);

  /* Mock card fields — cosmetic only. */
  const [card, setCard] = useState('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');

  const payMock = async () => {
    setProcessing(true);
    /* Simulate the round-trip of an authorization. */
    await new Promise((r) => setTimeout(r, 1400));
    setProcessing(false);
    onSuccess({
      razorpayPaymentId: `pay_mock_${Date.now().toString(36)}`,
      razorpayOrderId: payment.orderId,
      razorpaySignature: 'mock_signature',
    });
  };

  const payWithRazorpay = async () => {
    setProcessing(true);
    const Razorpay = await loadRazorpay();
    if (!Razorpay) {
      toast.error('Could not load the payment gateway');
      setProcessing(false);
      return;
    }

    const rzp = new Razorpay({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: Math.round(amount * 100),
      currency: payment.currency || 'INR',
        name: 'Bookify',
      description: `Booking · ${booking.itemTitle}`,
      theme: { color: '#7c3aed' },
      prefill: {
        name: booking.contact?.name,
        email: booking.contact?.email,
        contact: booking.contact?.phone,
      },
      handler: (res) => {
        onSuccess({
          razorpayPaymentId: res.razorpay_payment_id,
          razorpayOrderId: res.razorpay_order_id,
          razorpaySignature: res.razorpay_signature,
        });
      },
      modal: { ondismiss: () => setProcessing(false) },
    });

    rzp.on('payment.failed', (resp) => {
      toast.error(resp.error?.description || 'Payment failed — please try again');
      setProcessing(false);
    });
    rzp.open();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl bg-ink-900/70 px-4 py-3">
        <span className="text-sm text-slate-400">Amount payable</span>
        <span className="font-display text-xl font-bold text-white">
          {formatCurrency(amount)}
        </span>
      </div>

      {isMock ? (
        <>
          <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Demo mode — no real card is charged. Test card pre-filled.
          </p>

          <div className="space-y-3">
            <Input
              label="Card number"
              icon={CreditCard}
              value={card}
              onChange={(e) => setCard(e.target.value)}
              inputMode="numeric"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              <Input
                label="CVC"
                icon={Lock}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <Button fullWidth size="lg" className="mt-5" loading={processing} onClick={payMock}>
            Pay {formatCurrency(amount)}
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0c2451] text-[#3395ff]">
                R
              </span>
              Razorpay Secure Checkout
            </div>
            <p className="mt-2 text-xs text-slate-400">
              You’ll complete payment in Razorpay’s secure window. All major
              methods are supported:
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="chip">
                <CreditCard className="h-3 w-3" /> Cards
              </span>
              <span className="chip">
                <Smartphone className="h-3 w-3" /> UPI
              </span>
              <span className="chip">
                <Wallet className="h-3 w-3" /> Wallets
              </span>
              <span className="chip">Netbanking</span>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-5"
            loading={processing}
            onClick={payWithRazorpay}
          >
            Pay {formatCurrency(amount)} securely
          </Button>
        </>
      )}

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Lock className="h-3 w-3" /> Payments are encrypted and PCI-DSS compliant
      </p>
    </div>
  );
}
