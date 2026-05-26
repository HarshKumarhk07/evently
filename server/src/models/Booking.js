import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemType: { type: String, enum: ['Restaurant', 'Play', 'Event'], required: true },
    item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemType' },

    /* Snapshot so the booking is readable even if the listing changes later. */
    itemTitle: { type: String, required: true },
    itemImage: { type: String, default: '' },

    /* Dining: table reservation. */
    reservation: {
      date: Date,
      time: String,
      guests: Number,
    },

    /* Plays / Events: seat or ticket selection. */
    tickets: [
      {
        category: String,
        price: Number,
        quantity: Number,
      },
    ],
    showtime: { type: Date },
    seats: [{ type: String }],

    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    contact: {
      name: String,
      email: String,
      phone: String,
    },
  },
  { timestamps: true },
);

bookingSchema.pre('validate', function setReference(next) {
  if (!this.reference) {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.reference = `DST-${Date.now().toString(36).slice(-5).toUpperCase()}${rand}`;
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);
