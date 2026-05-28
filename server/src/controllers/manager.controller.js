import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { signToken, cookieOptions, generateOTP, hashToken } from '../utils/token.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { emailService } from '../services/email.service.js';
import logger from '../utils/logger.js';

/* OTP behaviour. */
const OTP_TTL_MS = 10 * 60 * 1000;          // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;   // 1 minute between sends
const OTP_MAX_ATTEMPTS = 5;                  // wipe the OTP after this many wrong tries

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

function normalizeMedia(value) {
  if (!value) return undefined;
  if (value === '') return undefined;
  if (typeof value === 'string') return { url: value, publicId: '' };
  if (typeof value === 'object') {
    return {
      url: value.url || '',
      publicId: value.publicId || '',
    };
  }
  return undefined;
}

/**
 * Generates a fresh 6-digit OTP, stores it hashed on the user, and emails it.
 * Returns the raw OTP so dev mode can surface it back to the client.
 */
async function issueVerificationOtp(user) {
  const otp = generateOTP();
  user.emailOTP = hashToken(otp);
  user.emailOTPExpires = Date.now() + OTP_TTL_MS;
  user.emailOTPLastSentAt = new Date();
  /* Reset the brute-force counter each time we issue a fresh code. */
  user.emailOTPAttempts = 0;
  await user.save({ validateBeforeSave: false });

  const mail = await emailService.sendManagerVerificationOTP(user, otp);
  return { mail };
}

/* Maps a Brevo failure into a user-facing message we can put into the
   API response — never leaks API keys / sender details / stack traces. */
function emailFailureMessage(mail) {
  if (!mail || mail.ok || mail.mocked) return null;
  if (mail.kind === 'sender_not_verified') {
    return 'Our mail provider could not send the verification email (sender not verified). Please contact support.';
  }
  if (mail.kind === 'auth' || mail.kind === 'config') {
    return 'Our email service is misconfigured. Please contact support.';
  }
  if (mail.kind === 'quota') {
    return 'Our mail quota is temporarily exhausted. Please try again in a few minutes.';
  }
  return 'We were unable to send the verification email. Please use the Resend button to try again.';
}

/**
 * POST /api/managers/register
 * Multipart form. Creates a manager user in `pending_email` status, generates
 * a 6-digit OTP, and emails it. The account holds no session yet — they
 * confirm via OTP, then wait for admin approval.
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
  const [profileImage, businessLicense, idProof, businessImages] = await Promise.all([
    uploadDoc(files.profileImage?.[0], 'bookify/managers/profile'),
    uploadDoc(files.businessLicense?.[0], 'bookify/managers/license'),
    uploadDoc(files.idProof?.[0], 'bookify/managers/idproof'),
    Promise.all(
      (files.businessImages || []).map((f) => uploadDoc(f, 'bookify/managers/business')),
    ).then((arr) => arr.filter(Boolean)),
  ]);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    city,
    role: 'manager',
    provider: 'email',
    /* The profile photo doubles as the user's avatar. */
    avatar: profileImage || undefined,
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

  const { mail } = await issueVerificationOtp(user);
  if (!mail?.ok && !mail?.mocked) {
    logger.warn(`Verification OTP email did not send for ${user.email} :: kind=${mail?.kind}`);
  }

  return created(
    res,
    {
      user,
      /* Echo the email so the client can render it on the verify screen
         and pass it to the verify-otp / resend endpoints. */
      email: user.email,
      /* The OTP itself is NEVER returned. The client must read it from
         the user's actual inbox. */
      emailDelivered: Boolean(mail?.ok),
      emailDeliveryError: emailFailureMessage(mail),
    },
    'Application received — please enter the 6-digit code we just emailed you',
  );
});

/**
 * POST /api/managers/verify-otp
 * Body: { email, otp } — completes email verification, moves the manager
 * to `pending_approval`, fires the "application received" thank-you email
 * and issues the session JWT so they can land on their dashboard.
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailOTP +emailOTPExpires +emailOTPAttempts',
  );
  if (!user) throw ApiError.badRequest('No application found for this email');

  if (
    !user.emailOTP ||
    !user.emailOTPExpires ||
    user.emailOTPExpires.getTime() < Date.now()
  ) {
    throw ApiError.badRequest('This code has expired — please request a new one');
  }

  if (user.emailOTP !== hashToken(otp)) {
    /* Brute-force protection: count the failed attempt. After N strikes the
       OTP is wiped and the user is forced to request a fresh code. */
    user.emailOTPAttempts = (user.emailOTPAttempts || 0) + 1;
    const remaining = OTP_MAX_ATTEMPTS - user.emailOTPAttempts;

    if (user.emailOTPAttempts >= OTP_MAX_ATTEMPTS) {
      user.emailOTP = undefined;
      user.emailOTPExpires = undefined;
      user.emailOTPAttempts = 0;
      await user.save({ validateBeforeSave: false });
      throw ApiError.badRequest(
        'Too many incorrect attempts — please request a fresh code',
      );
    }
    await user.save({ validateBeforeSave: false });
    throw ApiError.badRequest(
      `That code does not match — ${remaining} ${remaining === 1 ? 'try' : 'tries'} remaining`,
    );
  }

  user.isVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpires = undefined;
  user.emailOTPLastSentAt = undefined;
  user.emailOTPAttempts = 0;

  /* Move managers from pending_email → pending_approval once verified. */
  if (user.role === 'manager' && user.managerProfile?.status === 'pending_email') {
    user.managerProfile.status = 'pending_approval';
  }
  await user.save({ validateBeforeSave: false });

  /* Step 2 — professional "we got your application" thank-you. */
  emailService.sendManagerApplicationReceived(user).catch((err) =>
    logger.warn(`application-received email failed: ${err.message}`),
  );

  /* Issue the session JWT so they can land directly on the dashboard
     (which will show the "awaiting approval" screen until an admin acts). */
  const sessionToken = signToken({ id: user._id, role: user.role });
  res.cookie('token', sessionToken, cookieOptions());
  return ok(res, { token: sessionToken, user }, 'Email verified — application is now under review');
});

/**
 * POST /api/managers/resend-otp
 * Body: { email } — generates a fresh OTP and emails it. Rate-limited via
 * `emailOTPLastSentAt` to avoid abuse and inbox flooding.
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailOTPLastSentAt',
  );
  if (!user) {
    /* Respond the same regardless of whether the account exists so this
       endpoint cannot enumerate registered emails. */
    return ok(res, null, 'If that email exists, a fresh code has been sent');
  }

  if (user.isVerified) {
    throw ApiError.badRequest('This email is already verified — please log in');
  }

  if (
    user.emailOTPLastSentAt &&
    Date.now() - user.emailOTPLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    const wait = Math.ceil(
      (OTP_RESEND_COOLDOWN_MS - (Date.now() - user.emailOTPLastSentAt.getTime())) / 1000,
    );
    throw ApiError.badRequest(`Please wait ${wait}s before requesting another code`);
  }

  const { mail } = await issueVerificationOtp(user);

  return ok(
    res,
    {
      emailDelivered: Boolean(mail?.ok),
      emailDeliveryError: emailFailureMessage(mail),
    },
    'A fresh code has been sent to your email',
  );
});

/**
 * POST /api/managers/verify-email — legacy token-link path, kept so any
 * verification emails already in inboxes still work.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const hash = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hash,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) throw ApiError.badRequest('This verification link is invalid or has expired');

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  if (user.role === 'manager' && user.managerProfile?.status === 'pending_email') {
    user.managerProfile.status = 'pending_approval';
  }
  await user.save({ validateBeforeSave: false });

  emailService.sendManagerApplicationReceived(user).catch(() => {});

  const sessionToken = signToken({ id: user._id, role: user.role });
  res.cookie('token', sessionToken, cookieOptions());
  return ok(res, { token: sessionToken, user }, 'Email verified');
});

/* GET /api/managers/me — current manager's profile (mirrors /auth/me). */
export const getMyManagerProfile = asyncHandler(async (req, res) => ok(res, req.user));

export const uploadMyMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image provided');
  const result = await uploadBuffer(req.file.buffer, 'bookify/managers/profile').catch(() => null);
  if (!result) throw ApiError.badRequest('Image hosting is not configured on this server');
  return ok(res, { url: result.secure_url, publicId: result.public_id }, 'Image uploaded');
});

export const updateMyManagerProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const body = req.body || {};

  if (body.name !== undefined) user.name = body.name;
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.city !== undefined) user.city = body.city;

  user.managerProfile = user.managerProfile || {};
  if (body.businessName !== undefined) user.managerProfile.businessName = body.businessName;
  if (body.businessType !== undefined) user.managerProfile.businessType = body.businessType;
  if (body.businessAddress !== undefined) user.managerProfile.businessAddress = body.businessAddress;
  if (body.gstNumber !== undefined) user.managerProfile.gstNumber = body.gstNumber;
  if (body.panNumber !== undefined) user.managerProfile.panNumber = body.panNumber;
  if (body.aadhaarNumber !== undefined) user.managerProfile.aadhaarNumber = body.aadhaarNumber;
  if (body.profileImage !== undefined) user.avatar = normalizeMedia(body.profileImage) || {};
  if (body.businessLicense !== undefined) user.managerProfile.businessLicense = normalizeMedia(body.businessLicense) || {};
  if (body.idProof !== undefined) user.managerProfile.idProof = normalizeMedia(body.idProof) || {};
  if (body.businessImages !== undefined) {
    user.managerProfile.businessImages = (Array.isArray(body.businessImages) ? body.businessImages : []).map(normalizeMedia).filter(Boolean);
  }

  await user.save({ validateBeforeSave: false });
  return ok(res, user, 'Profile updated');
});

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

/* GET /api/managers/me/bookings — bookings on listings owned by the current manager. */
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
