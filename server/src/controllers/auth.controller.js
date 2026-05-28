import User from '../models/User.js';
import env from '../config/env.js';
import { verifyIdToken } from '../config/firebase.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { signToken, generateOTP, cookieOptions } from '../utils/token.js';
import { emailService } from '../services/email.service.js';

function authPayload(user) {
  const token = signToken({ id: user._id, role: user.role });
  return { token, user };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, phone, city });
  emailService.sendWelcome(user).catch(() => {});

  const { token } = authPayload(user);
  res.cookie('token', token, cookieOptions());
  return created(res, { token, user }, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { token } = authPayload(user);
  res.cookie('token', token, cookieOptions());
  return ok(res, { token, user }, 'Welcome back');
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', cookieOptions());
  return ok(res, null, 'Logged out');
});

export const getMe = asyncHandler(async (req, res) => ok(res, req.user));

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  /* Always respond the same way so the endpoint cannot enumerate accounts.
     The OTP is only ever delivered through email — never returned to the
     client. */
  if (user) {
    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    emailService.sendOTP(user, otp).catch(() => {});
  }

  return ok(res, null, 'If that email exists, a verification code has been sent');
});

/**
 * POST /auth/google
 * Body: { idToken } — a Firebase ID token from the client-side popup flow.
 *
 * Verifies the token server-side, finds-or-creates the user in MongoDB,
 * and returns our own JWT so the rest of the API is unchanged.
 */
export const googleAuth = asyncHandler(async (req, res) => {
  if (!env.hasFirebase) {
    throw new ApiError(501, 'Google sign-in is not configured on this server');
  }

  const { idToken } = req.body || {};
  if (!idToken) throw ApiError.badRequest('idToken is required');

  let decoded;
  try {
    decoded = await verifyIdToken(idToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired Google session');
  }

  const { uid, email, name, picture, email_verified: emailVerified } = decoded;
  if (!email) throw ApiError.badRequest('Google account did not return an email');

  const normalizedEmail = email.toLowerCase();

  /* Match by Firebase UID first, then fall back to email so existing
     email/password accounts get linked to Google rather than duplicated. */
  let user = await User.findOne({
    $or: [{ googleId: uid }, { email: normalizedEmail }],
  });

  if (user) {
    let dirty = false;
    if (!user.googleId) {
      user.googleId = uid;
      user.provider = 'google';
      dirty = true;
    }
    if (picture && !user.avatar?.url) {
      user.avatar = { url: picture, publicId: '' };
      dirty = true;
    }
    if (emailVerified && !user.isVerified) {
      user.isVerified = true;
      dirty = true;
    }
    if (dirty) await user.save({ validateBeforeSave: false });
  } else {
    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      provider: 'google',
      googleId: uid,
      avatar: picture ? { url: picture, publicId: '' } : undefined,
      isVerified: Boolean(emailVerified),
    });
    emailService.sendWelcome(user).catch(() => {});
  }

  const { token } = authPayload(user);
  res.cookie('token', token, cookieOptions());
  return ok(res, { token, user }, `Signed in as ${user.name}`);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  const user = await User.findOne({ email }).select('+resetOTP +resetOTPExpires');
  if (!user || user.resetOTP !== otp || !user.resetOTPExpires || user.resetOTPExpires < Date.now()) {
    throw ApiError.badRequest('Invalid or expired verification code');
  }

  user.password = password;
  user.resetOTP = undefined;
  user.resetOTPExpires = undefined;
  await user.save();

  return ok(res, null, 'Password reset successfully — you can now log in');
});
