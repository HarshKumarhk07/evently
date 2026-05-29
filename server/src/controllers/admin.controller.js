import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { emailService } from '../services/email.service.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMedia(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return { url: '', publicId: '' };
  if (typeof value === 'string') return { url: value, publicId: '' };
  if (typeof value === 'object') {
    return { url: value.url || '', publicId: value.publicId || '' };
  }
  return undefined;
}

function normalizeManagerProfile(profile = {}) {
  const next = { ...profile };
  if (Object.prototype.hasOwnProperty.call(profile, 'businessLicense')) {
    next.businessLicense = normalizeMedia(profile.businessLicense) || { url: '', publicId: '' };
  }
  if (Object.prototype.hasOwnProperty.call(profile, 'idProof')) {
    next.idProof = normalizeMedia(profile.idProof) || { url: '', publicId: '' };
  }
  if (Object.prototype.hasOwnProperty.call(profile, 'businessImages')) {
    next.businessImages = Array.isArray(profile.businessImages)
      ? profile.businessImages.map((item) => normalizeMedia(item)).filter(Boolean)
      : [];
  }
  return next;
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
  const body = req.body || {};
  const allowed = ['role', 'isVerified', 'name', 'email', 'phone', 'city', 'avatar', 'managerProfile'];
  const updates = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) updates[k] = body[k];
  }

  /* Prevent creating more than one admin account. */
  if (updates.role === 'admin') {
    const existingAdmin = await User.findOne({ role: 'admin' }).lean();
    if (existingAdmin && String(existingAdmin._id) !== String(req.params.id)) {
      throw ApiError.badRequest('There is already an admin account');
    }
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Apply top-level updates
  for (const [k, v] of Object.entries(updates)) {
    if (k === 'managerProfile') {
      user.managerProfile = { ...user.managerProfile, ...normalizeManagerProfile(v) };
    } else if (k === 'avatar') {
      user.avatar = normalizeMedia(v) || { url: '', publicId: '' };
    } else {
      user[k] = v;
    }
  }
  await user.save({ validateBeforeSave: false });
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

/* PATCH /api/admin/bookings/:id — override a booking status. Keeps the
   paymentStatus in sync so revenue analytics stay correct when an admin
   confirms / cancels / completes a booking manually. */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');

  booking.status = status;
  if (status === 'confirmed' || status === 'completed') {
    if (booking.amount > 0) booking.paymentStatus = 'paid';
  } else if (status === 'cancelled') {
    if (booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
    else booking.paymentStatus = 'unpaid';
  }
  await booking.save();
  return ok(res, booking, 'Booking updated');
});

/* POST /api/admin/managers — admin creates a new manager directly,
   bypassing the OTP / self-registration flow. Marked verified + approved
   immediately so the new manager can start listing right away. */
export const adminCreateManager = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    city,
    businessName,
    businessType,
    businessAddress,
    panNumber = '',
    aadhaarNumber = '',
    gstNumber = '',
  } = req.body;

  if (!name?.trim()) throw ApiError.badRequest('Name is required');
  if (!email?.trim()) throw ApiError.badRequest('Email is required');
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }
  if (!businessName?.trim()) throw ApiError.badRequest('Business name is required');

  const normalized = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    name: name.trim(),
    email: normalized,
    password,
    phone: phone || '',
    city: city || '',
    role: 'manager',
    provider: 'email',
    isVerified: true,
    managerProfile: {
      businessName: businessName.trim(),
      businessType: businessType || 'Restaurant',
      businessAddress: businessAddress || '',
      panNumber: (panNumber || '').toUpperCase(),
      aadhaarNumber: aadhaarNumber || '',
      gstNumber: gstNumber || '',
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user._id,
      businessLicense: {},
      idProof: {},
      businessImages: [],
      bankDetails: {},
    },
  });

  return created(res, user, 'Manager created');
});
