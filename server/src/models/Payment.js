import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['razorpay', 'mock'], default: 'mock' },

    /* Razorpay order id (created server-side) and the payment id Razorpay
       returns once Checkout completes. */
    orderId: { type: String, index: true },
    paymentId: { type: String, default: '' },

    status: {
      type: String,
      enum: ['created', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'created',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Payment', paymentSchema);
