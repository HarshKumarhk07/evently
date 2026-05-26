import User from '../models/User.js';
import env from '../config/env.js';
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
  let devOtp = null;

  /* Always respond the same way so the endpoint cannot enumerate accounts. */
  if (user) {
    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    emailService.sendOTP(user, otp).catch(() => {});

    /* Convenience for local demos with no mail provider — never exposed in production. */
    if (!env.isProd && !env.hasMail) devOtp = otp;
  }

  return ok(
    res,
    devOtp ? { devOtp } : null,
    'If that email exists, a verification code has been sent',
  );
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
