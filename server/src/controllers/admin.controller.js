import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/ApiResponse.js';
import { emailService } from '../services/email.service.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const filter = {};
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (search) {
    const rx = new RegExp(escapeRegExp(search), 'i');
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
  
  /* Prevent creating more than one admin account. */
  if (updates.role === 'admin') {
    const existingAdmin = await User.findOne({ role: 'admin' }).lean();
    if (existingAdmin && String(existingAdmin._id) !== String(req.params.id)) {
      throw ApiError.badRequest('There is already an admin account');
    }
  }

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

/* ────────────────────────── Manager approval ────────────────────────── */

/**
 * GET /api/admin/managers — list manager accounts.
 * `?status=pending_approval|approved|rejected|all`
 */
export const listManagers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const filter = { role: 'manager' };
  const status = req.query.status;
  if (status && status !== 'all') {
    filter['managerProfile.status'] = status;
  }
  if (req.query.search) {
    const rx = new RegExp(escapeRegExp(String(req.query.search)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { 'managerProfile.businessName': rx }];
  }

  const [items, total, pendingCount] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
    User.countDocuments({ role: 'manager', 'managerProfile.status': 'pending_approval' }),
  ]);

  return paginated(res, items, { page, limit, total }, 'OK', { pendingCount });
});

/* GET /api/admin/managers/:id — full manager profile (includes uploaded docs). */
export const getManager = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'manager' }).lean();
  if (!user) throw ApiError.notFound('Manager not found');
  return ok(res, user);
});

/* Toggles all listings owned by the given manager. Called when their
   approval status changes so the public homepage reflects the change. */
async function toggleManagerListingVisibility(ownerId, isActive) {
  const filter = { owner: ownerId };
  const update = { isActive };
  const [r, p, e] = await Promise.all([
    Restaurant.updateMany(filter, update),
    Play.updateMany(filter, update),
    Event.updateMany(filter, update),
  ]);
  return { restaurants: r.modifiedCount, plays: p.modifiedCount, events: e.modifiedCount };
}

/* POST /api/admin/managers/:id/approve */
export const approveManager = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'manager' });
  if (!user) throw ApiError.notFound('Manager not found');
  if (!user.managerProfile) throw ApiError.badRequest('No manager profile to approve');

  user.managerProfile.status = 'approved';
  user.managerProfile.approvedAt = new Date();
  user.managerProfile.approvedBy = req.user._id;
  user.managerProfile.rejectionReason = '';
  await user.save({ validateBeforeSave: false });

  /* Make any of their existing listings public again. */
  await toggleManagerListingVisibility(user._id, true);
  emailService.sendManagerApproved(user).catch(() => {});
  return ok(res, user, 'Manager approved');
});

/* POST /api/admin/managers/:id/reject — body { reason } */
export const rejectManager = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'manager' });
  if (!user) throw ApiError.notFound('Manager not found');
  if (!user.managerProfile) throw ApiError.badRequest('No manager profile to reject');

  user.managerProfile.status = 'rejected';
  user.managerProfile.rejectionReason = req.body?.reason || 'No reason provided';
  await user.save({ validateBeforeSave: false });

  /* Hide their listings from the public homepage immediately. */
  await toggleManagerListingVisibility(user._id, false);
  emailService.sendManagerRejected(user, user.managerProfile.rejectionReason).catch(() => {});
  return ok(res, user, 'Manager rejected');
});

/* POST /api/admin/email-test — manually send a test email through the
   configured mail provider. Returns the provider's raw response so you
   can debug Brevo configuration issues from the admin UI. */
export const sendTestEmail = asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;
  const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#0c0a14;padding:32px;color:#e2e0ea">
    <h2 style="color:#fff">Bookify email test</h2>
    <p>${message}</p>
    <p style="color:#7a7395;font-size:12px;margin-top:32px">Sent from the Bookify admin email-test endpoint.</p>
  </body></html>`;
  const result = await emailService.send({ to, subject, html });
  /* Always 200 so the client can render success / failure detail itself. */
  return ok(res, result, result.ok ? 'Test email sent' : 'Test email failed');
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
