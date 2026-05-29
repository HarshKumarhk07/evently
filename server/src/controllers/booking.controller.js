import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { paymentService } from '../services/payment.service.js';
import { emailService } from '../services/email.service.js';

const SERVICE_FEE = 0; // flat convenience fee, kept at 0 for the demo

function titleOf(item, itemType) {
  return itemType === 'Restaurant' ? item.name : item.title;
}

/* POST /api/bookings — create a pending booking and a matching payment intent. */
export const createBooking = asyncHandler(async (req, res) => {
  const { itemType, itemId, contact, reservation, showtime, tickets, seats } = req.body;

  const Model = mongoose.model(itemType);
  const item = await Model.findById(itemId);
  if (!item || item.isActive === false) throw ApiError.notFound('Listing not available');

  let amount = 0;
  let quantity = 1;

  if (itemType === 'Restaurant') {
    quantity = reservation.guests;
    /* Charge an estimated bill upfront so the booking actually goes through
       Razorpay — costForTwo / 2 per guest. Managers who want truly-free
       reservations can set costForTwo to 0. */
    const perGuest = Math.round((item.costForTwo || 0) / 2);
    amount = perGuest * quantity + SERVICE_FEE;
  } else {
    quantity = tickets.reduce((sum, t) => sum + t.quantity, 0);
    amount = tickets.reduce((sum, t) => sum + t.price * t.quantity, 0) + SERVICE_FEE;

    /* Verify seat / ticket availability before reserving. */
    const pools = itemType === 'Play' ? item.seatCategories : item.ticketTypes;
    for (const t of tickets) {
      const pool = pools.find((p) => p.name === t.category);
      if (!pool) throw ApiError.badRequest(`Unknown ticket category: ${t.category}`);
      const sold = itemType === 'Play' ? pool.bookedSeats : pool.soldQuantity;
      const total = itemType === 'Play' ? pool.totalSeats : pool.totalQuantity;
      if (sold + t.quantity > total) {
        throw ApiError.conflict(`Not enough availability for ${t.category}`);
      }
    }
  }

  const booking = await Booking.create({
    user: req.user._id,
    itemType,
    item: item._id,
    itemTitle: titleOf(item, itemType),
    itemImage: item.coverImage,
    reservation,
    showtime: showtime || undefined,
    tickets,
    seats,
    quantity,
    amount,
    contact,
    status: amount > 0 ? 'pending' : 'confirmed',
    paymentStatus: amount > 0 ? 'unpaid' : 'paid',
  });

  /* Free reservations (dining) confirm instantly. */
  if (amount === 0) {
    emailService.sendBookingConfirmation(req.user, booking).catch(() => {});
    return created(res, { booking, payment: null }, 'Reservation confirmed');
  }

  const order = await paymentService.createOrder({
    amount,
    currency: 'INR',
    receipt: booking.reference,
    notes: { bookingId: String(booking._id), userId: String(req.user._id) },
  });

  const payment = await Payment.create({
    user: req.user._id,
    booking: booking._id,
    amount,
    currency: order.currency,
    provider: order.provider,
    orderId: order.orderId,
  });
  booking.payment = payment._id;
  await booking.save();

  return created(
    res,
    {
      booking,
      payment: {
        provider: order.provider,
        orderId: order.orderId,
        keyId: paymentService.keyId,
        amount: order.amount,
        currency: order.currency,
      },
    },
    'Booking created — complete payment to confirm',
  );
});

/* POST /api/bookings/:id/confirm — finalize after a successful payment. */
export const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status === 'confirmed') return ok(res, booking, 'Already confirmed');

  const payment = await Payment.findById(booking.payment);
  if (!payment) throw ApiError.badRequest('No payment found for this booking');

  /* Validate the signature Razorpay Checkout returned to the client. */
  const { razorpayPaymentId, razorpaySignature } = req.body;
  const { valid } = paymentService.verifyPayment({
    orderId: payment.orderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) {
    payment.status = 'failed';
    await payment.save();
    throw ApiError.badRequest('Payment verification failed');
  }

  /* Reserve seats / tickets atomically on the listing. */
  if (booking.itemType !== 'Restaurant') {
    const Model = mongoose.model(booking.itemType);
    const item = await Model.findById(booking.item);
    const pools = booking.itemType === 'Play' ? item.seatCategories : item.ticketTypes;
    for (const t of booking.tickets) {
      const pool = pools.find((p) => p.name === t.category);
      if (pool) {
        if (booking.itemType === 'Play') pool.bookedSeats += t.quantity;
        else pool.soldQuantity += t.quantity;
      }
    }
    await item.save();
  }

  payment.status = 'succeeded';
  payment.paymentId = razorpayPaymentId || '';
  await payment.save();
  booking.status = 'confirmed';
  booking.paymentStatus = 'paid';
  await booking.save();

  emailService.sendBookingConfirmation(req.user, booking).catch(() => {});
  return ok(res, booking, 'Booking confirmed');
});

/* GET /api/bookings/me — current user's bookings. */
export const getMyBookings = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);
  return paginated(res, items, { page, limit, total });
});

/* GET /api/bookings/:id — a single booking owned by the user. */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  return ok(res, booking);
});

/* PATCH /api/bookings/:id/cancel */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status === 'cancelled') throw ApiError.badRequest('Booking already cancelled');
  if (booking.status === 'completed') throw ApiError.badRequest('Completed bookings cannot be cancelled');

  /* Release reserved seats / tickets back to the pool. */
  if (booking.status === 'confirmed' && booking.itemType !== 'Restaurant') {
    const Model = mongoose.model(booking.itemType);
    const item = await Model.findById(booking.item);
    if (item) {
      const pools = booking.itemType === 'Play' ? item.seatCategories : item.ticketTypes;
      for (const t of booking.tickets) {
        const pool = pools.find((p) => p.name === t.category);
        if (pool) {
          if (booking.itemType === 'Play') pool.bookedSeats = Math.max(0, pool.bookedSeats - t.quantity);
          else pool.soldQuantity = Math.max(0, pool.soldQuantity - t.quantity);
        }
      }
      await item.save();
    }
  }

  booking.status = 'cancelled';
  if (booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  await booking.save();
  return ok(res, booking, 'Booking cancelled');
});
