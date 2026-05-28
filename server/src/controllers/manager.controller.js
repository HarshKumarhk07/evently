import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { signToken, cookieOptions, generateVerificationToken, hashToken } from '../utils/token.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { emailService } from '../services/email.service.js';
import env from '../config/env.js';

/**
 * Streams a multer file to Cloudinary and returns a { url, publicId } pair —
 * or null if Cloudinary isn't configured / no file provided.
 */
async function uploadDoc(file, folder) {
  if (!file?.buffer) return null;
  const result = await uploadBuffer(file.buffer, folder).catch(() => null);
  if (!result) return null;
  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * POST /api/managers/register
 * Multipart form. Creates a manager user in `pending_email` status and sends
 * a verification link. The account holds no session yet — they confirm via
 * email, then wait for admin approval.
 */
export const registerManager = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone, city,
    businessName, businessType, businessAddress,
    gstNumber, panNumber, aadhaarNumber,
    bankAccountName, bankAccountNumber, bankIfsc,
  } = req.body;

  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  /* Upload supporting docs in parallel. Best-effort — registration still
     succeeds if Cloudinary is offline (admin will see missing docs). */
  const files = req.files || {};
  const [businessLicense, idProof, businessImages] = await Promise.all([
    uploadDoc(files.businessLicense?.[0], 'bookify/managers/license'),
    uploadDoc(files.idProof?.[0], 'bookify/managers/idproof'),
    Promise.all(
      (files.businessImages || []).map((f) => uploadDoc(f, 'bookify/managers/business')),
    ).then((arr) => arr.filter(Boolean)),
  ]);

  const { token, hash } = generateVerificationToken();

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    city,
    role: 'manager',
    provider: 'email',
    emailVerificationToken: hash,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
    managerProfile: {
      businessName,
      businessType,
      businessAddress,
      gstNumber: gstNumber || '',
      panNumber: panNumber.toUpperCase(),
      aadhaarNumber,
      businessLicense: businessLicense || {},
      idProof: idProof || {},
      businessImages: businessImages || [],
      bankDetails: {
        accountName: bankAccountName || '',
        accountNumber: bankAccountNumber || '',
        ifsc: bankIfsc?.toUpperCase() || '',
      },
      status: 'pending_email',
    },
  });

  const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
  emailService.sendEmailVerification(user, verifyUrl).catch(() => {});

  return created(
    res,
    {
      user,
      /* Convenience shortcut in development — engineers can click straight
         through without checking their inbox. Stripped in production. */
      ...(env.isProd ? {} : { devVerifyToken: token, devVerifyUrl: verifyUrl }),
    },
    'Account created — please verify your email to continue',
  );
});

/**
 * POST /api/managers/verify-email
 * Body: { token } — the raw URL token from the email.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const hash = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hash,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) {
    throw ApiError.badRequest('This verification link is invalid or has expired');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  /* Move managers from pending_email → pending_approval once verified. */
  if (user.role === 'manager' && user.managerProfile?.status === 'pending_email') {
    user.managerProfile.status = 'pending_approval';
  }
  await user.save({ validateBeforeSave: false });

  /* Issue the session JWT so they can land directly on the dashboard
     (where they'll see the "awaiting approval" screen). */
  const sessionToken = signToken({ id: user._id, role: user.role });
  res.cookie('token', sessionToken, cookieOptions());
  return ok(res, { token: sessionToken, user }, 'Email verified');
});

/* GET /api/managers/me — current manager's profile (mirrors /auth/me). */
export const getMyManagerProfile = asyncHandler(async (req, res) => ok(res, req.user));

/* GET /api/managers/me/listings — every listing owned by the current manager. */
export const getMyListings = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const [restaurants, plays, events] = await Promise.all([
    Restaurant.find({ owner: ownerId }).sort({ createdAt: -1 }).lean(),
    Play.find({ owner: ownerId }).sort({ createdAt: -1 }).lean(),
    Event.find({ owner: ownerId }).sort({ createdAt: -1 }).lean(),
  ]);
  return ok(res, {
    restaurants,
    plays,
    events,
    total: restaurants.length + plays.length + events.length,
  });
});

/* GET /api/managers/me/bookings — every booking on a listing owned by the
   current manager (so they can see what's been booked at their venues). */
export const getMyBookings = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const [restaurantIds, playIds, eventIds] = await Promise.all([
    Restaurant.find({ owner: ownerId }).distinct('_id'),
    Play.find({ owner: ownerId }).distinct('_id'),
    Event.find({ owner: ownerId }).distinct('_id'),
  ]);

  const allItemIds = [...restaurantIds, ...playIds, ...eventIds];
  if (!allItemIds.length) return ok(res, { items: [], total: 0 });

  const bookings = await Booking.find({
    item: { $in: allItemIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'name email')
    .lean();

  return ok(res, { items: bookings, total: bookings.length });
});
