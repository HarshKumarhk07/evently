import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/ApiResponse.js';

/* GET /api/admin/stats — headline metrics for the analytics dashboard. */
export const getStats = asyncHandler(async (_req, res) => {
  const [users, restaurants, plays, events, bookings, revenueAgg, statusAgg, recent] =
    await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Play.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email').lean(),
    ]);

  /* Bookings per day for the last 7 days — feeds the dashboard chart. */
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trend = await Booking.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return ok(res, {
    totals: { users, restaurants, plays, events, bookings },
    revenue: revenueAgg[0]?.total || 0,
    bookingsByStatus: statusAgg.reduce((m, s) => ({ ...m, [s._id]: s.count }), {}),
    trend,
    recentBookings: recent,
  });
});

/* GET /api/admin/users */
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 12;
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (req.query.role) filter.role = req.query.role;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return paginated(res, items, { page, limit, total });
});

/* PATCH /api/admin/users/:id — change role or verification status. */
export const updateUser = asyncHandler(async (req, res) => {
  const { role, isVerified } = req.body;
  const updates = {};
  if (role) updates.role = role;
  if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, user, 'User updated');
});

/* DELETE /api/admin/users/:id */
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, null, 'User deleted');
});

/* GET /api/admin/bookings — every booking across the platform. */
export const listBookings = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 15;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.itemType) filter.itemType = req.query.itemType;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
    Booking.countDocuments(filter),
  ]);
  return paginated(res, items, { page, limit, total });
});

/* PATCH /api/admin/bookings/:id — override a booking status. */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );
  if (!booking) throw ApiError.notFound('Booking not found');
  return ok(res, booking, 'Booking updated');
});
