import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/* Six-digit numeric OTP for password reset / verification flows. */
export function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/* URL-safe random token used in email-verification links.
   Returns { token, hash } — store the hash, mail the raw token. */
export function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
}

/* Cookie options shared by login / logout. */
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
